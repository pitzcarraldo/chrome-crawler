import React, { useEffect, useState } from 'react';
import '@pages/popup/Popup.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';

const MESSAGE_CONNECTION_SUCCESS = '연동되었습니다.';
const MESSAGE_CONNECTION_FAIL = '연동에 실패하였습니다.<br>입력하신 정보를 다시 확인해주세요.';

export interface Settings {
  cssSelector: string;
  matchFilterType: '==' | '!=' | '>' | '<' | 'includes';
  matchFilterValue: string;
  interval: string;
  telegramBotToken: string;
  telegramChatId: string;
  running: 'true' | 'false';
}

const DEFAULT_SETTING: Settings = {
  cssSelector: '',
  matchFilterType: '==',
  matchFilterValue: '',
  interval: '1',
  telegramBotToken: '',
  telegramChatId: '',
  running: 'false',
};

const Popup = () => {
  const [searchResult, setSearchResult] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTING);

  useEffect(() => {
    (async () => {
      const storageSetting: Settings = await chrome.storage.local.get() as Settings;
      setSettings({...settings, ...storageSetting});
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings(prev => {
      const settings = { ...prev, [e.target.name]: e.target.value };
      chrome.storage.local.set(settings);
      return settings;
    });
  };

  const onClickBotSave = async () => {
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;
    const msg = encodeURI('Chrome Crawler 알림이 연동되었습니다.');
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${msg}`;
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await chrome.storage.local.set({ 'telegramBotToken': botToken, 'telegramChatId': chatId });
        setMessage(MESSAGE_CONNECTION_SUCCESS);
      } else {
        setMessage(MESSAGE_CONNECTION_FAIL);
      }
    } catch (e) {
      setMessage(MESSAGE_CONNECTION_FAIL);
      console.error(e);
    }
  };

  const onClickSearch = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { type: 'VERIFY', cssSelector: settings.cssSelector }, response => {
        setSearchResult(response);
      });
    });
  };

  const onClickStart = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      await chrome.storage.local.set({ ...settings, running: 'true' });
      await chrome.tabs.sendMessage(tabs[0].id!, { type: 'START' });
    });
  };


  return (
    <div className="container">
      <div className="row">
        <input name="cssSelector" value={settings.cssSelector} onChange={handleChange} placeholder="CSS Selector" />
        <button onClick={onClickSearch}>찾기</button>
      </div>
      <div className="row">
        <input style={{ width: '33%' }} readOnly value={searchResult} placeholder="현재 값" />
        <select style={{ width: '33%' }} name="matchFilterType" value={settings.matchFilterType}
                onChange={handleChange}>
          <option value="==">==</option>
          <option value="!=">!=</option>
          <option value=">">{'>'}</option>
          <option value="<">{'<'}</option>
        </select>
        <input style={{ width: '33%' }} name="matchFilterValue" value={settings.matchFilterValue}
               onChange={handleChange}
               placeholder="대상 값" />
      </div>
      <input name="interval" type="number" value={settings.interval} onChange={handleChange}
             placeholder="Interval (Minutes)" />
      <input name="telegramBotToken" value={settings.telegramBotToken} onChange={handleChange}
             placeholder="Telegram Bot Token" />
      <input name="telegramChatId" value={settings.telegramChatId} onChange={handleChange}
             placeholder="Telegram Chat ID" />
      <div style={{'background': 'white'}}>{message}</div>
      <button onClick={onClickBotSave} type="button" className="button">텔레그램 봇 연결</button>
      <button onClick={onClickStart}>시작</button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
