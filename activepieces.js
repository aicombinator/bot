import { airtable as ap_airtable } from '@activepieces/piece-airtable';
import { asana as ap_asana } from '@activepieces/piece-asana';
import { bannerbear as ap_bannerbear } from '@activepieces/piece-bannerbear';
import { binance as ap_binance } from '@activepieces/piece-binance';
import { blackbaud as ap_blackbaud } from '@activepieces/piece-blackbaud';
import { clickup as ap_clickup } from '@activepieces/piece-clickup';
import { discord as ap_discord } from '@activepieces/piece-discord';
import { drip as ap_drip } from '@activepieces/piece-drip';
import { dropbox as ap_dropbox } from '@activepieces/piece-dropbox';
import { figma as ap_figma } from '@activepieces/piece-figma';
import { gmail as ap_gmail } from '@activepieces/piece-gmail';
import { googleCalendar as ap_googleCalendar } from '@activepieces/piece-google-calendar';
import { googleContacts as ap_googleContacts } from '@activepieces/piece-google-contacts';
import { googleDrive as ap_googleDrive } from '@activepieces/piece-google-drive';
import { googleSheets as ap_googleSheets } from '@activepieces/piece-google-sheets';
import { googleTasks as ap_googleTasks } from '@activepieces/piece-google-tasks';
import { hackernews as ap_hackernews } from '@activepieces/piece-hackernews';
import { hubspot as ap_hubspot } from '@activepieces/piece-hubspot';
import { intercom as ap_intercom } from '@activepieces/piece-intercom';
import { mailchimp as ap_mailchimp } from '@activepieces/piece-mailchimp';
import { openai as ap_openai } from '@activepieces/piece-openai';
import { pipedrive as ap_pipedrive } from '@activepieces/piece-pipedrive';
import { posthog as ap_posthog } from '@activepieces/piece-posthog';
import { sendgrid as ap_sendgrid } from '@activepieces/piece-sendgrid';
import { slack as ap_slack } from '@activepieces/piece-slack';
import { square as ap_square } from '@activepieces/piece-square';
import { stripe as ap_stripe } from '@activepieces/piece-stripe';
import { telegramBot as ap_telegramBot } from '@activepieces/piece-telegram-bot';
import { todoist as ap_todoist } from '@activepieces/piece-todoist';
import { trello as ap_trello } from '@activepieces/piece-trello';
import { twilio as ap_twilio } from '@activepieces/piece-twilio';
import { typeform as ap_typeform } from '@activepieces/piece-typeform';
import { wordpress as ap_wordpress } from '@activepieces/piece-wordpress';
import { youtube as ap_youtube } from '@activepieces/piece-youtube';
import { zoom as ap_zoom } from '@activepieces/piece-zoom';

function createAPTask(piece, name) {
	return async (bot, params) => {
		let task = piece._actions[name].run;
		let context = {
			propsValue: {
				authentication: {
					access_token: (await bot.get_param(piece.name, 'access_token', params))
				},
				...params
			}
		};
		// console.log({context});
		return await task(context);
	}
}

function mapTasks(provider){
	let p = {};
	for(let actionName in provider._actions){
		let new_action_name = actionName.replace(`${provider.name}_`, '');
		// console.log(`${provider.name}.${new_action_name}`);
		p[new_action_name] = createAPTask(provider, actionName)
	}
	return p;
}

export const airtable = mapTasks(ap_airtable);
export const asana = mapTasks(ap_asana);
export const bannerbear = mapTasks(ap_bannerbear);
export const binance = mapTasks(ap_binance);
export const blackbaud = mapTasks(ap_blackbaud);
export const clickup = mapTasks(ap_clickup);
export const discord = mapTasks(ap_discord);
export const drip = mapTasks(ap_drip);
export const dropbox = mapTasks(ap_dropbox);
export const figma = mapTasks(ap_figma);
export const gmail = mapTasks(ap_gmail);
export const googleCalendar = mapTasks(ap_googleCalendar);
export const googleContacts = mapTasks(ap_googleContacts);
export const googleDrive = mapTasks(ap_googleDrive);
export const googleSheets = mapTasks(ap_googleSheets);
export const googleTasks = mapTasks(ap_googleTasks);
export const hackernews = mapTasks(ap_hackernews);
export const hubspot = mapTasks(ap_hubspot);
export const intercom = mapTasks(ap_intercom);
export const mailchimp = mapTasks(ap_mailchimp);
export const openai = mapTasks(ap_openai);
export const pipedrive = mapTasks(ap_pipedrive);
export const posthog = mapTasks(ap_posthog);
export const sendgrid = mapTasks(ap_sendgrid);
export const slack = mapTasks(ap_slack);
export const square = mapTasks(ap_square);
export const stripe = mapTasks(ap_stripe);
export const telegram = mapTasks(ap_telegramBot);
export const todoist = mapTasks(ap_todoist);
export const trello = mapTasks(ap_trello);
export const twilio = mapTasks(ap_twilio);
export const typeform = mapTasks(ap_typeform);
export const wordpress = mapTasks(ap_wordpress);
export const youtube = mapTasks(ap_youtube);
export const zoom = mapTasks(ap_zoom);

