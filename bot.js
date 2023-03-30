// convenience methods and shared behaviour between LocalBot and CloudBot

import puppeteer from 'puppeteer-extra';
import * as aicombinator from './recipes.js';
import totp from 'totp-generator';

export class Bot {

	constructor(){

	}

	async init_browser(){
		let dirname = this.bot_id || this.token;

		this.browser = await puppeteer.launch({ 
			headless: this.headless,
			defaultViewport: null,
			userDataDir: `/tmp/aicombinator_chromedir/${dirname}`,
			args: [
				'--start-maximized'
			]
		});
	}

	async finish(){
		// closes the browser and performs other cleanup
		if(this.browser) await this.browser.close();
	}

	async get_param(ctx, name, params){
		let name_with_ctx = `${ctx}_${name}`;
		return params[name] || process.env[name_with_ctx.toUpperCase()] || params[name_with_ctx] || await this.get(name_with_ctx);
	}

	async get_latest_in_array(key){
		// eg: latest email in email_inbox
		// when value is an array of objects with timestamp and new entries are appended.
		let value = await this.get(key);
		return value[value.length - 1];
	}

	async get_2fa_totp(site, options, params) {
		// standardize key name and totp library
		let secret = await this.get_param(site, '2fa_secret', params);
		if(!secret) return null; // 2FA not set-up for this site+account
		return totp(secret, options);
	}

	async get_phone(){
		return (await this.get('phone'));
	}

	async get_email(){
		return (await this.get('email'));
	}

	// TODO: Other standard key names: payment_methods, address, username, image, bio, location

	async wait(seconds){
		return await new Promise(r => setTimeout(r, seconds*1000));
	}

	async execute_command(cmd){
		let code = await this.parse_command(cmd);
		let eval_code = `(async () => {\n${code}\n})()`;
		
		console.log("\n\nRunning the following code:\n");
		console.log(eval_code);
		console.log("\n\n")
		
		let bot = this;
		if(eval_code.includes("aicombinator.twitter") || eval_code.includes("aicombinator.google_sms") || eval_code.includes("aicombinator.github")){
			// task requires a browser. initialize puppeteer.
			await bot.init_browser();
		}

		await bot.wait(2);
		await eval(eval_code); 
	}

	static list_tasks(){
		return Object.keys(aicombinator);
	}

	async parse_command_ai(cmd, openai_api_key){
		let prompt = ` 
I want you to act as a senior programmer. 
I want you to answer only with the fenced code block.
Do not write explanations.

Use the below listed utility methods to write Javascript code for the following task:

${cmd}

// API reference for all available utility methods: 

aicombinator.google_sms.pair_device(bot, {})
aicombinator.twitter.login(bot, {twitter_username: "user", twitter_password: "password"})
aicombinator.twitter.post(bot, {message: "test"})
aicombinator.github.login(bot, {})
aicombinator.zoom.create_meeting(bot, {})
aicombinator.airtable.create_record(bot, {})
aicombinator.asana.create_task(bot, {})
aicombinator.bannerbear.create_image(bot, {})
aicombinator.binance.fetch_crypto_pair_price(bot, {})
aicombinator.blackbaud.create_contact_batch(bot, {})
aicombinator.blackbaud.search_contacts_after_date(bot, {})
aicombinator.blackbaud.create_contact_if_not_exists(bot, {})
aicombinator.blackbaud.update_contact(bot, {})
aicombinator.clickup.create_task(bot, {})
aicombinator.clickup.create_folderless_list(bot, {})
aicombinator.clickup.get_list(bot, {})
aicombinator.clickup.get_space(bot, {})
aicombinator.clickup.get_spaces(bot, {})
aicombinator.clickup.get_task_comments(bot, {})
aicombinator.clickup.create_task_comments(bot, {})
aicombinator.clickup.create_subtask(bot, {})
aicombinator.discord.send_message_webhook(bot, {})
aicombinator.drip.apply_tag_to_subscriber(bot, {})
aicombinator.drip.add_subscriber_to_campaign(bot, {})
aicombinator.drip.upsert_subscriber(bot, {})
aicombinator.dropbox.create_new_folder(bot, {})
aicombinator.dropbox.create_new_text_file(bot, {})
aicombinator.figma.get_file(bot, {})
aicombinator.figma.get_comments(bot, {})
aicombinator.figma.post_comment(bot, {})
aicombinator.gmail.send_email(bot, {})
aicombinator.gmail.get_mail(bot, {})
aicombinator.gmail.search_mail(bot, {})
aicombinator.gmail.get_thread(bot, {})
aicombinator.googleCalendar.create_quick_event(bot, {})
aicombinator.googleContacts.add_contact(bot, {})
aicombinator.googleDrive.create_new_gdrive_folder(bot, {})
aicombinator.googleDrive.create_new_gdrive_file(bot, {})
aicombinator.googleSheets.insert_row(bot, {})
aicombinator.googleTasks.add_task(bot, {})
aicombinator.hackernews.fetch_top_stories(bot, {number_of_stories})
aicombinator.hubspot.create_contact(bot, {})
aicombinator.hubspot.create_or_update_contact(bot, {})
aicombinator.hubspot.add_contact_to_list(bot, {})
aicombinator.intercom.get_or_create_contact(bot, {})
aicombinator.intercom.create_contact(bot, {})
aicombinator.intercom.send_message(bot, {})
aicombinator.mailchimp.add_member_to_list(bot, {})
aicombinator.openai.ask_chatgpt(bot, {})
aicombinator.pipedrive.add_person(bot, {})
aicombinator.posthog.create_event(bot, {})
aicombinator.posthog.create_project(bot, {})
aicombinator.sendgrid.send_email(bot, {})
aicombinator.slack.send_direct_message(bot, {})
aicombinator.slack.send_channel_message(bot, {})
aicombinator.telegram-bot.send_text_message(bot, {})
aicombinator.todoist.create_task(bot, {})
aicombinator.trello.create_card(bot, {})
aicombinator.trello.get_card(bot, {})
aicombinator.twilio.send_sms(bot, {})
aicombinator.wordpress.create_post(bot, {})
aicombinator.zoom.create_meeting(bot, {})
aicombinator.zoom.create_meeting_registrant(bot, {})

// Example: post a message to twitter (login if necessary):
await aicombinator.twitter.post(bot, {message: 'hello'});

// some tasks may return useful results which should be printed:
let result = await aicombinator.hackernews.fetch_top_stories(bot, {number_of_stories: 1});
console.log({result});

// Now generate code for the following task:
${cmd}
`;

		const response = await fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${openai_api_key}`,
			},
			body: JSON.stringify({
				prompt: prompt,
				max_tokens: 1000,
				n: 1,
				stop: '\n\n\n',
			}),
		});
		const data = await response.json();
		// console.log({data});
		let code = data.choices[0].text.trim();
		// console.log({code});
		return code;
	}

	async parse_command(cmd){
		// console.log({cmd});
		let openai_api_key = await this.get_param('openai', 'api_key', {});
		
		if(openai_api_key){
			return await this.parse_command_ai(cmd, openai_api_key);
		}
		
		let sentences = cmd.split('. ');
		let sentences_clean = sentences.map(s => s.trim().replace(/\.$/,'').replace(/^then /i,'').trim());
		// console.log({sentences_clean});
		// {task} (at {site})? (with {args})?/
		let parts = sentences_clean.map(s => {
			let args = s.split(' with ')[1];
			let site = s.split(' with ')[0].split(/ on | to | at | from /);
			site = site.length == 1 ? undefined : site[site.length - 1].replace(' ', '_');
			let task = s.split(' with ')[0].split(/ on | to | at | from /)[0].replace(' ', '_');
			// console.log({task, site, args});

			if(args)
				args = args.split(' and ').reduce((acc, item) => {
					let key = item.split(' ')[0];
					let value = item.replace(/\w+ /,''); // remove first word because that's the key
					return {...acc, [key]: value};
				}, {});
			else
				args = {};
			return {task, site, args};
		});
		// console.log({parts});
		parts.forEach((p, idx) => {
			if(p.site == undefined) p.site = parts[idx-1].site;
		});
		let code = parts.map(p => `\tawait aicombinator.${p.site}.${p.task}(bot, ${JSON.stringify(p.args)});`).join("\n");
		return new Promise((resolve, reject) => resolve(code));
	}
}