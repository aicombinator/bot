// This implements a bot interface that has access to aicombinator platform server.
// Requires an auth_token and can receive SMS and email. It needs to be initialized.
// All getters/setters are necessarily async.

import {Bot} from './bot.js';
import { createClient } from '@supabase/supabase-js';
import google_sms from './google_sms.js';

/*

LocalBot uses only our local machine for everything.
CloudBot uses the aicombinator platform (needs an auth token) but the browser is still local.
CloudBot has access to a server so it can handle inbound and outbound 
SMS and Email (for OTP verification, payments etc) and webhooks. 
It also gets a persistent datastore.
CloudBot allows your team members to use shared config/secrets when running bots. 
And your tasks can be triggered by API calls, webhooks, Zapier etc.
Get access: https://aicombinator.app/

*/
export class CloudBot extends Bot {
	token = null;
	supabase = null;
	bot_record = null;
	browser = null;
	headless = false;

	constructor(bot_token){
		super();
		this.token = bot_token;
	}

	static async init({bot_token, headless}) {
		// TODO: Allow caller to override puppeteer launch params for primary profile, extensions etc
		
		if(!bot_token) throw `bot_token not specified`;
		if(!process.env.SUPABASE_URL) throw `supabase_url not specified`;
		if(!process.env.SUPABASE_ANON_KEY) throw `supabase_anon_key not specified`;

		let bot = new CloudBot(bot_token);
		bot.headless = headless;

		// First get a client with anon role
		let supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
			auth: {
			  autoRefreshToken: false,
			  persistSession: false,
			  detectSessionInUrl: false
			}
		})
				
		// Now use bot_token to get a custom JWT to authenticate as a bot owned by a User:
		let { data, error } = await supabase.functions.invoke('get_jwt_for_bot', {
			body: { bot_token: bot.token }
		})
		
		if(error) throw error;
		// console.log(data.jwt);

		// send this JWT with every request from now on
		bot.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
			auth: {
			  autoRefreshToken: false,
			  persistSession: false,
			  detectSessionInUrl: false
			},
			global: {
				headers: {
				  Authorization: `Bearer ${data.jwt}`
				}
			}
		});

		({ data, error } = await bot.supabase.from('bots').select('*'));		
		if(data.length != 1) throw 'unique bot not found';
		bot.bot_record = data[0];
		return bot;
	}

	async get(key){
		if(['phone', 'email'].includes(key)){
			// these keys are special because are used for identity verification and require server's support
			return this.bot_record[key];
		} else {
			let { data, error } = await this.supabase
				.from('bot_storage')
				.select('*')
				.eq('bot_id', this.bot_record.id)
				.eq('bkey', key)
				.limit(1);
			if(error) throw error;
			if(data.length == 0) return null;
			if(data.length > 1) throw `duplicate key ${key}`;
			return data[0].bvalue;
		}
	}

	async set(key, value){
		if(['phone', 'email'].includes(key)){ 
			throw 'Phone and Email can only be changed from the dashboard';
		};
		// upsert to bot_storage table.
		const { error } = await this.supabase
			.from('bot_storage')
			.upsert({ bvalue: value, bkey: key, bot_id: this.bot_record.id })
			.select();
		if(error) throw error;
	}

	async get_latest_inbound_email(){
		return (await this.get_latest_in_array('email_inbox'));
	}

	async send_email(to, subject, body){
		return await this.cloud_action('send_email', {to, subject, body})
	}

	async get_latest_inbound_sms(to_phone, pattern){
		let is_phone_in_cloud = true;
		if(is_phone_in_cloud)
			return await this.cloud_action('get_latest_inbound_sms', {to_phone, pattern});
		else
			return await google_sms.get_latest_inbound_sms(this, {to_phone, pattern});
	}

	async send_sms(to_phone, message_body){
		let is_phone_in_cloud = true;
		if(is_phone_in_cloud)
			return await this.cloud_action('send_sms', {to_phone, message_body});
		else {
			let send_from_sim_id = 1;
			return await google_sms.send_sms(this, {send_from_sim_id, to_phone, message});
		}
	}

	async cloud_action(action, params){
		return await this.supabase.functions.invoke('cloud_action', {
			action: action,
			params: params
		})
	}
}
