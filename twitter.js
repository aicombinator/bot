export async function login(bot, params) {

	const page = (await bot.browser.pages())[0];

	await page.goto('https://twitter.com/home');
	await bot.wait(3);

	const twitter_username = await bot.get_param('twitter', 'username', params);
	console.log({twitter_username});
	if(!twitter_username) throw `twitter_username not found`;

	if(page.url() == 'https://twitter.com/home'){
		console.log("Didn't get redirected. Already logged-in.");
		let account_switcher = await page.$('div[data-testid="SideNav_AccountSwitcher_Button"]');
		if(account_switcher && (await account_switcher.evaluate(el => el.textContent)).includes('@' + twitter_username)) {
			console.log("In the desired account");
			return;
		} else {
			console.log("Different account. TODO: Switch or Add account");
			await page.goto('https://twitter.com/i/flow/login');
			await bot.wait(3);
		}	
	} else {
		await page.goto('https://twitter.com/i/flow/login');
		await bot.wait(3);
	}
	
	const twitter_password = await bot.get_param('twitter', 'password', params);

	if(!twitter_password) throw 'twitter_password not found';

	// Log in to Twitter
	await page.waitForSelector('input[autocomplete="username"]', { visible: true });
	await page.type('input[autocomplete="username"]', twitter_username, { delay: 100 });

	await (await page.waitForSelector('text/Next')).click();

	await page.waitForSelector('input[name="password"]', { visible: true });
	await page.type('input[name="password"]', twitter_password, { delay: 100 });
	const login = await page.waitForSelector('text/Log in');
	await login.click();

	await bot.wait(3);
	
	// Fill in 2FA code or OTP Todo: check if SMS or TOTP is actually needed or not
	// const twitter_otp = await bot.get_latest_inbound_sms(phone, pattern);
	let twitter_otp = await bot.get_2fa_totp('twitter', {}, params);

	await page.bringToFront();
	
	await page.type('input[inputmode="numeric"]', twitter_otp, { delay: 100 });

	await (await page.waitForSelector('text/Next')).click();
	await page.waitForNavigation();
	await bot.wait(2);

	// Check if login was successful. If yes, save username/password in storage.

	if(page.url() == 'https://twitter.com/home') {
		await bot.set('twitter_username', twitter_username);
		await bot.set('twitter_password', twitter_password);
	}
}

async function check_if_logged_in(bot){
	const page = (await bot.browser.pages())[0];
	await page.goto('https://twitter.com/');
	await bot.wait(4);
	if(page.url() == 'https://twitter.com/') {
		// Hasn't been redirected to /home
		return false;
	} else {
		return true;
	}
}

export async function post(bot, params){
	if(params.message == undefined || params.message.length == 0){
		throw `message not specified`;
	}
	const page = (await bot.browser.pages())[0];
	let is_logged_in = await check_if_logged_in(bot, page);

	if(is_logged_in == false) {
		console.log("Need to login to Twitter first");
		await login(bot, params, page);
	}

	// Type the message
	await page.type(
		'div[data-testid="tweetTextarea_0"]',
		params.message,
		{ delay: 100 }
	);

	// Post the tweet
	// await page.click('div[data-testid="tweetButtonInline"]');

	// Wait for the tweet to post
	// await page.waitForNavigation();
}

export default {
	login,
	post
}