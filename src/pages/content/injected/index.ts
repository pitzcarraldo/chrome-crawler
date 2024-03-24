chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'VERIFY':
      if (request.cssSelector) {
        const text = document.querySelector(request.cssSelector)?.innerText;
        sendResponse(text);
      }
      return;
    case 'START':
      console.log('START');
      window.location.reload();
      return;
  }
});

const stopTask = () => chrome.runtime.sendMessage({ type: 'STOP' });

window.addEventListener('load', async () => {
  setTimeout(async () => {
    const settings = (await chrome.storage.local.get()) || {};
    const running = settings['running'];
    if (running === 'true') {
      const cssSelector = settings['cssSelector'];
      if (cssSelector) {
        const text = document.querySelector(cssSelector)?.textContent;
        const interval = parseInt(settings['interval']);
        if (interval) {
          setTimeout(() => {
            window.location.reload();
          }, 60 * 1000 * interval);
        }
        if (text) {
          const matchFilterType = settings['matchFilterType'];
          const matchFilterValue = settings['matchFilterValue'];
          switch (matchFilterType) {
            case '==':
              if (text == matchFilterValue) {
                stopTask();
              }
              break;
            case '!=':
              if (text != matchFilterValue) {
                stopTask();
              }
              break;
            case '>':
              if (text > matchFilterValue) {
                stopTask();
              }
              break;
            case '<':
              if (text < matchFilterValue) {
                stopTask();
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }, 1000);
});