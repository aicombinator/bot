#!/usr/bin/env node

// https://nodejs.org/api/util.html#utilparseargsconfig
import { parseArgs } from "node:util";

import {LocalBot} from './local_bot.js';
import {CloudBot} from './cloud_bot.js';

(async () => {
	// Parse command-line options
	const {
		values,
		positionals
	} = parseArgs({
		options: {
			'data-dir': {type: 'string', default: '.aicombinator'},
			'bot': {type: 'string', default: 'mybot1'},
			'token': {type: 'string'},
			'headless': {type: 'boolean', default: false},
			'test': {type: 'boolean', default: false},
			'list-apps': {type: 'boolean', default: false},
		},
		allowPositionals: true
	});

	// Print arguments 
	// console.log(values, {positionals});
	
	let cmd = positionals[0];
	
	if(!cmd && values.test){
		cmd = "pair device on google sms. Then post on twitter with message hello world from aicombinator. Then fetch the top story from hacker news";
	}

	if(values['list-apps']) {
		console.log("\n\nAvailable apps:\n");
		console.log(LocalBot.list_tasks());
	}
	
	let bot;
	if(!cmd){
		console.error(`\nNo command specified`);
		return;
	} else {
		console.log({cmd});
	}

	let bot_type = values.token ? "cloud" : "local";

	if(bot_type == "local"){
		bot = await LocalBot.init({
			bot_id: values.bot, 
			data_dir: values['data-dir'],
			headless: values.headless
		});
	} else if (bot_type == "cloud"){
		bot = await CloudBot.init({
			bot_token: values.token,
			headless: values.headless
		});
	}

	try {
		await bot.execute_command(cmd);
	} catch (err) {
		console.error('Error:', err);
	}
	
	await bot.finish();
})();