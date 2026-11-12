import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import { App } from './App';
import { useAppStore } from '~/storage/store';
import { createDefaultAppData } from '~/storage/defaults';

const query = vi.fn();
const send = vi.fn();
beforeEach(() => {
  const data = createDefaultAppData();
  data.settings.uiLanguage = 'en';
  data.settings.theme = 'light';
  useAppStore.setState({ data, loaded: true, load: async () => {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: 'test' }), openOptionsPage: vi.fn() }, tabs: { query, sendMessage: send } });
  query.mockReset().mockResolvedValue([{ id: 1, url: 'https://example.org' }]);
  send.mockReset().mockResolvedValue({ translated: false });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('popup current-page control', () => {
  it('keeps trigger mode out of the popup and toggles the current page through its status row', async () => {
    render(<App />);
    const toggle = screen.getByRole('switch', { name: 'Translate full page' }) as HTMLButtonElement;
    await waitFor(() => expect(toggle.disabled).toBe(false));
    expect(screen.queryByText('Trigger mode')).toBeNull();
    expect(screen.queryByText('vtest')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Translate page' })).toBeNull();
    send.mockResolvedValueOnce({ translated: true });
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('true'));
    expect(send).toHaveBeenLastCalledWith(1, { type: 'page:toggle' });
  });
  it('disables translation on restricted browser pages', async () => {
    query.mockResolvedValueOnce([{ id: 1, url: 'chrome://extensions' }]);
    render(<App />);
    await screen.findByText('Translation is not available on this browser page.');
    expect((screen.getByRole('switch', { name: 'Translate full page' }) as HTMLButtonElement).disabled).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });
  it('offers a refresh hint when the content script is unavailable', async () => {
    send.mockRejectedValueOnce(new Error('no receiver'));
    render(<App />);
    await screen.findByText(/Refresh this webpage/);
    expect((screen.getByRole('switch', { name: 'Translate full page' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('popup layout (v0.2.3)', () => {
  it('names the site and says which state the page is in', async () => {
    query.mockResolvedValue([{ id: 1, url: 'https://news.example.org/a', favIconUrl: 'https://news.example.org/f.ico' }]);
    render(<App />);
    await screen.findByText('news.example.org');
    await screen.findByText('Showing the original page');
    send.mockResolvedValueOnce({ translated: true });
    fireEvent.click(screen.getByRole('switch', { name: 'Translate full page' }));
    await screen.findByText('Showing both languages');
  });

  it('shows the shortcuts in hotkey mode only, and no free-service statement', async () => {
    const first = render(<App />);
    await screen.findByText('Showing the original page');
    expect(first.container.querySelector('footer')).toBeNull();
    expect(screen.queryByText('About free translation services')).toBeNull();
    cleanup();
    useAppStore.setState({ data: { ...useAppStore.getState().data, settings: {
      ...useAppStore.getState().data.settings, triggerMode: 'hotkey', hotkey: 'Alt+T', fullPageHotkey: 'Alt+A',
    } } });
    const { container } = render(<App />);
    const keys = Array.from(container.querySelectorAll('footer kbd')).map((k) => k.textContent);
    expect(keys).toEqual(['Alt', 'T', 'Alt', 'A']);
  });

  it('still shows no version number', async () => {
    render(<App />);
    await screen.findByText('Showing the original page');
    expect(screen.queryByText(/vtest|test$/)).toBeNull();
  });
});

describe('popup Thai dub', () => {
  it('turns automatic dubbing on with one switch', async () => {
    const updateSettings = vi.fn(async () => {});
    useAppStore.setState({ updateSettings });
    render(<App />);
    fireEvent.click(screen.getByRole('switch', { name: 'Automatic Thai dub' }));
    expect(updateSettings).toHaveBeenCalledWith({ dub: expect.objectContaining({ autoStart: true }) });
  });

  it('turns the dub up and the video down with the panel buttons', async () => {
    const updateSettings = vi.fn(async () => {});
    useAppStore.setState({ updateSettings });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Dub volume −' }));
    expect(updateSettings).toHaveBeenLastCalledWith({ dub: expect.objectContaining({ volume: 90 }) });
    fireEvent.click(screen.getByRole('button', { name: 'Video volume while dubbing −' }));
    expect(updateSettings).toHaveBeenLastCalledWith({ dub: expect.objectContaining({ duckVolume: 0 }) });
  });
});
