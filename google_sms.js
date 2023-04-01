export async function pair_device(bot, params){
	const page = await bot.browser.newPage();
	await page.goto('https://messages.google.com/web/authentication');

	await bot.wait(2);
	if(page.url() == 'https://messages.google.com/web/conversations'){
		// already paired
		await page.close();
		return;
	}

	const remember = await page.waitForSelector('mat-slide-toggle button');
	await remember.click();

	// Here, user needs to perform manual device pairing by scanning the QR code on their Google Messages app
	console.log("Waiting for user to scan the QR code on their Google Messages mobile app")
	await bot.wait(15);
	console.log("Proceeding...");
	await page.close();
}

export async function get_latest_inbound_sms(bot, params){
	const page = await bot.browser.newPage();
	await page.goto('https://messages.google.com/web/conversations');
	await bot.wait(10);

	// TODO: Read sms text matching params.pattern
	// ignore params.to_phone because Google Messages on Web doesn't show recipient phone or sim_id

	const element = await page.waitForSelector('mws-conversation-list-item');
	await element.click();
	await bot.wait(10);
	const msg = await page.$('mws-message-wrapper:last-of-type .text-msg');
	if(msg) {
		return await msg.evaluate(e => e.innerText); // TODO: Extract sender_phone, timestamp, sim_id etc
	}
	return null;
}

export async function send_sms(bot, {send_from_sim_id, to_phone, message}){
	// TODO: send SMS
}

export default {
	pair_device,
	get_latest_inbound_sms,
	send_sms
}