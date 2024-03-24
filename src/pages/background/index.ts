import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

const sendTelegramMessage = async (): Promise<void> => {
  const settings = await chrome.storage.local.get();
  const botToken: string | null = settings['telegramBotToken'];
  const chatId: string | null = settings['telegramChatId'];
  const matchFilterType: string | null = settings['matchFilterType'];
  const matchFilterValue: string | null = settings['matchFilterValue'];
  if (!botToken || !chatId || !matchFilterType || !matchFilterValue) {
    return;
  }
  const message: string = encodeURI(`${matchFilterValue} ${matchFilterType} 키워드가 탐지 되었습니다.`);
  const url: string = `https://api.telegram.org/bot${botToken}/sendmessage?chat_id=${chatId}&text=${message}`;
  await fetch(url);
};

chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  switch (request.type) {
    case 'STOP':
      console.log('STOP');
      await sendTelegramMessage();
      await chrome.storage.local.set({ 'running': 'false' });
      sendResponse(true);
      return true;
  }
});
