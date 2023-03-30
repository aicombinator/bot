// Sample script to run using @aicombinator/bot

import * as aicombinator from '@aicombinator/bot';

(async () => {

	/*
	Let's choose our bot type: LocalBot or CloudBot.
	LocalBot uses only our local machine for everything.
	CloudBot uses the aicombinator platform (needs an auth token) for advanced capabilities.
	But the browser still runs on our local machine only.
	*/

	const bot = await aicombinator.LocalBot.init({bot_id: 'mybot1', data_dir: null});
	// const bot = await bot.CloudBot.init({bot_token: process.env.AICOMBINATOR_BOT_TOKEN});
	
	try {
		// Write your automation here, using available scripts.

		let cmd = "pair device on google sms. Then post on twitter with username foo and password bar and message hello world from aicombinator. Then create meeting on zoom";
		await bot.execute_command(cmd);
		
		// The above commend is equivalent to the following code:
		
		// await aicombinator.google_sms.pair_device(bot, {}); // this needs to be set up once for SMS to work

		// twitter.post_tweet depends on twitter.login and will pass the params to it
		// If no creds passed in params, bot will look up for creds in the datastore or env vars
		// For CloudBot, the datastore can be edited at https://aicombinator.app/
		// await aicombinator.twitter.post_tweet(
		// 	bot, 
		// 	{
		//		username: 'foo',
		//		password: 'bar',
		// 		tweet: `hello world from aicombinator`
		// 	}
		// );
		// await bot.wait(5); // useful for manual intervention in GUI mode during task execution
		// await aicombinator.zoom.create_meeting(bot, {});
	} catch (err) {
		console.error('Error:', err);
	}

	await bot.finish(); // closes the browser and performs other cleanup
})();