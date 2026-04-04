'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ru';

interface Translations {
  common: {
    loading: string;
    processing: string;
    error: string;
    success: string;
    on: string;
    off: string;
    status: string;
    back: string;
  };
  landing: {
    title: string;
    subtitle: string;
    enter: string;
    booting: string;
    authorized_only: string;
    location: string;
    boot_sequence: string[];
    nav_news: string;
    nav_store: string;
    nav_account: string;
    scroll_down: string;
    latest_news: string;
    all_entries: string;
    terminal_seq_1: string;
    terminal_seq_2: string;
    terminal_seq_3: string;
    stats_title_1: string;
    stats_title_2: string;
    stats_desc: string;
    server_online: string;
    active_operatives: string;
  };
  auth: {
    login_title: string;
    register_title: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    login_action: string;
    register_action: string;
    to_register: string;
    to_login: string;
    forgot_password: string;
    already_registered: string;
    secure_connection: string;
  };
  dashboard: {
    welcome: string;
    id: string;
    time: string;
    logout: string;
    profile: string;
    activity: string;
    last_login: string;
    account_created: string;
    no_activity: string;
    role: string;
    banned: string;
    active: string;
    admin_panel: string;
    community: string;
    discord: string;
    telegram: string;
    top_players: string;
    classified: string;
    in_dev: string;
    status: string;
    account_active: string;
    access_level_granted: string;
    server: string;
    game_stats: string;
    level: string;
    balance: string;
    kd_ratio: string;
    download_launcher: string;
    download_title: string;
    download_subtitle: string;
    download_windows: string;
    download_size: string;
    download_version: string;
    to_main_site: string;
    leaderboard: string;
  };
  admin: {
    panel: string;
    overview: string;
    users: string;
    settings: string;
    total_users: string;
    active_24h: string;
    new_7d: string;
    banned_stats: string;
    new_registrations: string;
    view_all: string;
    system_telemetry: string;
    connection_status: string;
    latency: string;
    cpu: string;
    memory: string;
    connection: string;
    target_ip: string;
    port: string;
    default_port: string;
    rcon_port: string;
    default_rcon_port: string;
    rcon_password: string;
    primary_endpoint: string;
    save: string;
    saved: string;
    notes: string;
    notes_text: string[];
    logs: string;
    analytics: string;
    launcher: string;
    launcher_upload: string;
    launcher_upload_hint: string;
    launcher_select_file: string;
    launcher_uploaded: string;
    launcher_not_uploaded: string;
    launcher_size: string;
    launcher_cdn: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'LOADING',
      processing: 'PROCESSING',
      error: 'ERROR',
      success: 'SUCCESS',
      on: 'ON',
      off: 'OFF',
      status: 'STATUS',
      back: 'BACK',
    },
    landing: {
      title: 'PROJECT: MINECRAFT',
      subtitle: 'LARGE-SCALE SESSION COMBAT SQUAD / ARMA STYLE',
      enter: 'ENTER GAME',
      booting: 'SYSTEM BOOTING',
      authorized_only: 'PUBLIC ACCESS SERVER',
      location: 'LAT: 59.9311 N // LON: 30.3609 E',
      boot_sequence: [
        "INITIALIZING CONNECTION...",
        "ESTABLISHING UPLINK...",
        "VERIFYING ENCRYPTION...",
        "LOADING ASSETS...",
        "SYSTEM READY."
      ],
      nav_news: 'NEWS',
      nav_store: 'STORE',
      nav_account: 'ACCOUNT',
      scroll_down: 'SCROLL DOWN',
      latest_news: 'LATEST NEWS',
      all_entries: 'ALL ENTRIES [↗]',
      terminal_seq_1: 'INITIALIZING SECURE CONNECTION...',
      terminal_seq_2: 'CONNECTION ESTABLISHED.',
      terminal_seq_3: 'FETCHING LATEST LEADERBOARD DATA...',
      stats_title_1: 'LARGE-SCALE',
      stats_title_2: 'COMBAT OPERATIONS',
      stats_desc: 'Participate in massive session battles on huge maps. Coordinate with your squad, use vehicles and tactics to achieve victory in Battlefield and Squad style.',
      server_online: 'Server Online',
      active_operatives: 'Active Operatives'
    },
    auth: {
      login_title: 'SYSTEM LOGIN',
      register_title: 'NEW USER REGISTRATION',
      username: 'USERNAME',
      email: 'EMAIL',
      password: 'PASSWORD',
      confirm_password: 'CONFIRM PASSWORD',
      login_action: 'LOGIN',
      register_action: 'CREATE ACCOUNT',
      to_register: 'REGISTER',
      to_login: 'LOGIN',
      forgot_password: 'FORGOT PASSWORD?',
      already_registered: 'ALREADY REGISTERED?',
      secure_connection: 'SECURE CONNECTION ESTABLISHED'
    },
    dashboard: {
      welcome: 'WELCOME',
      id: 'ID',
      time: 'TIME',
      logout: 'LOGOUT',
      profile: 'PROFILE',
      activity: 'ACTIVITY LOG',
      last_login: 'LAST LOGIN',
      account_created: 'ACCOUNT CREATED',
      no_activity: 'NO OTHER ACTIVITY DETECTED',
      role: 'ROLE',
      banned: 'BANNED',
      active: 'ACTIVE',
      admin_panel: '[ ADMIN PANEL ]',
      community: 'COMMUNITY',
      discord: 'DISCORD',
      telegram: 'TELEGRAM',
      top_players: 'TOP PLAYERS',
      classified: 'CLASSIFIED',
      in_dev: 'IN DEVELOPMENT',
      status: 'USER STATUS',
      account_active: 'ACCOUNT ACTIVE',
      access_level_granted: 'ACCESS LEVEL GRANTED',
      server: 'SERVER',
      game_stats: 'GAME STATISTICS',
      level: 'LEVEL',
      balance: 'BALANCE',
      kd_ratio: 'K/D RATIO',
      download_launcher: 'DOWNLOAD LAUNCHER',
      download_title: 'LAUNCHER DEPLOYMENT PACKAGE',
      download_subtitle: 'Official launcher for connecting to the server',
      download_windows: 'DOWNLOAD FOR WINDOWS',
      download_size: 'SIZE: ~45 MB',
      download_version: 'VERSION: 1.0.0',
      to_main_site: 'MAIN SITE',
      leaderboard: 'LEADERBOARD'
    },
    admin: {
      panel: 'ADMIN PANEL',
      overview: 'OVERVIEW',
      users: 'USERS',
      settings: 'SETTINGS',
      total_users: 'TOTAL USERS',
      active_24h: 'ACTIVE (24H)',
      new_7d: 'NEW (7D)',
      banned_stats: 'BANNED',
      new_registrations: 'NEW REGISTRATIONS',
      view_all: 'VIEW ALL',
      system_telemetry: 'SYSTEM TELEMETRY',
      connection_status: 'CONNECTION STATUS',
      latency: 'LATENCY',
      cpu: 'CPU LOAD',
      memory: 'MEMORY USAGE',
      connection: 'CONNECTION',
      target_ip: 'TARGET IP',
      port: 'PORT',
      default_port: 'DEFAULT: 25565 [TCP/UDP]',
      rcon_port: 'RCON PORT',
      default_rcon_port: 'DEFAULT: 25651 [TCP]',
      rcon_password: 'RCON PASSWORD',
      primary_endpoint: 'PRIMARY ENDPOINT FOR TELEMETRY',
      save: 'SAVE CONFIG',
      saved: 'CONFIGURATION SAVED',
      notes: 'OPERATIONAL NOTES',
      notes_text: [
        'Specify the Game Server IP to enable real-time status monitoring.',
        'Telemetry updates occur automatically every 30 seconds.'
      ],
      logs: 'LOGS',
      analytics: 'ANALYTICS',
      launcher: 'LAUNCHER',
      launcher_upload: 'UPLOAD LAUNCHER',
      launcher_upload_hint:
        'Archive or .exe (max 150 MB). On Cloudflare set LAUNCHER_DOWNLOAD_URL or R2 + LAUNCHER_PUBLIC_URL_BASE; optional upload to R2 with LAUNCHER_R2_* keys.',
      launcher_select_file: 'SELECT FILE (.EXE / .ZIP / .7Z)',
      launcher_uploaded: 'Launcher uploaded',
      launcher_not_uploaded: 'Not uploaded',
      launcher_size: 'Size',
      launcher_cdn: 'Launcher file on CDN (R2)',
    }
  },
  ru: {
    common: {
      loading: 'ЗАГРУЗКА',
      processing: 'ОБРАБОТКА',
      error: 'ОШИБКА',
      success: 'УСПЕШНО',
      on: 'ВКЛ',
      off: 'ВЫКЛ',
      status: 'СТАТУС',
      back: 'НАЗАД',
    },
    landing: {
      title: 'PROJECT: MINECRAFT',
      subtitle: 'МАСШТАБНЫЕ СЕССИОННЫЕ БОИ В ФОРМАТЕ SQUAD / ARMA',
      enter: 'ВОЙТИ В ИГРУ',
      booting: 'ЗАГРУЗКА СИСТЕМЫ',
      authorized_only: 'СЕРВЕР ОБЩЕГО ДОСТУПА',
      location: 'ШИР: 59.9311 С // ДОЛ: 30.3609 В',
      boot_sequence: [
        "ИНИЦИАЛИЗАЦИЯ ПОДКЛЮЧЕНИЯ...",
        "УСТАНОВЛЕНИЕ СВЯЗИ...",
        "ПРОВЕРКА ШИФРОВАНИЯ...",
        "ЗАГРУЗКА РЕСУРСОВ...",
        "СИСТЕМА ГОТОВА."
      ],
      nav_news: 'НОВОСТИ',
      nav_store: 'МАГАЗИН',
      nav_account: 'УЧЕТНАЯ ЗАПИСЬ',
      scroll_down: 'ЛИСТАЙТЕ ВНИЗ',
      latest_news: 'ПОСЛЕДНИЕ НОВОСТИ',
      all_entries: 'ВСЕ ЗАПИСИ [↗]',
      terminal_seq_1: 'ИНИЦИАЛИЗАЦИЯ БЕЗОПАСНОГО СОЕДИНЕНИЯ...',
      terminal_seq_2: 'СОЕДИНЕНИЕ УСТАНОВЛЕНО.',
      terminal_seq_3: 'ПОЛУЧЕНИЕ ДАННЫХ ЛИДЕРБОРДА...',
      stats_title_1: 'Масштабные',
      stats_title_2: 'Боевые действия',
      stats_desc: 'Участвуйте в масштабных сессионных сражениях на огромных картах. Координируйте действия с отрядом, используйте технику и тактику для достижения победы в стиле Battlefield и Squad.',
      server_online: 'Сервер Онлайн',
      active_operatives: 'Активных Оперативников'
    },
    auth: {
      login_title: 'ВХОД В СИСТЕМУ',
      register_title: 'РЕГИСТРАЦИЯ',
      username: 'ИМЯ ПОЛЬЗОВАТЕЛЯ',
      email: 'ПОЧТА',
      password: 'ПАРОЛЬ',
      confirm_password: 'ПОВТОР ПАРОЛЯ',
      login_action: 'ВОЙТИ',
      register_action: 'СОЗДАТЬ АККАУНТ',
      to_register: 'РЕГИСТРАЦИЯ',
      to_login: 'ВОЙТИ',
      forgot_password: 'ЗАБЫЛИ ПАРОЛЬ?',
      already_registered: 'УЖЕ ЕСТЬ АККАУНТ?',
      secure_connection: 'БЕЗОПАСНОЕ СОЕДИНЕНИЕ УСТАНОВЛЕНО'
    },
    dashboard: {
      welcome: 'ДОБРО ПОЖАЛОВАТЬ',
      id: 'ID',
      time: 'ВРЕМЯ',
      logout: 'ВЫЙТИ',
      profile: 'ПРОФИЛЬ',
      activity: 'ЖУРНАЛ АКТИВНОСТИ',
      last_login: 'ПОСЛЕДНИЙ ВХОД',
      account_created: 'ДАТА РЕГИСТРАЦИИ',
      no_activity: 'НЕТ ДРУГИХ ДЕЙСТВИЙ',
      role: 'РОЛЬ',
      banned: 'ЗАБАНЕН',
      active: 'АКТИВЕН',
      admin_panel: '[ АДМИН ПАНЕЛЬ ]',
      community: 'СООБЩЕСТВО',
      discord: 'DISCORD',
      telegram: 'TELEGRAM',
      top_players: 'ТОП ИГРОКОВ',
      classified: 'ЗАСЕКРЕЧЕНО',
      in_dev: 'В РАЗРАБОТКЕ',
      status: 'СТАТУС',
      account_active: 'АККАУНТ АКТИВЕН',
      access_level_granted: 'ДОСТУП РАЗРЕШЕН',
      server: 'СЕРВЕР',
      game_stats: 'ИГРОВАЯ СТАТИСТИКА',
      level: 'УРОВЕНЬ',
      balance: 'БАЛАНС',
      kd_ratio: 'К/Д',
      download_launcher: 'СКАЧАТЬ ЛАУНЧЕР',
      download_title: 'ПАКЕТ РАЗВЁРТЫВАНИЯ ЛАУНЧЕРА',
      download_subtitle: 'Официальный лаунчер для подключения к серверу',
      download_windows: 'СКАЧАТЬ ДЛЯ WINDOWS',
      download_size: 'РАЗМЕР: ~45 МБ',
      download_version: 'ВЕРСИЯ: 1.0.0',
      to_main_site: 'НА САЙТ',
      leaderboard: 'ТАБЛИЦА ЛИДЕРОВ'
    },
    admin: {
      panel: 'АДМИН ПАНЕЛЬ',
      overview: 'ОБЗОР',
      users: 'ПОЛЬЗОВАТЕЛИ',
      settings: 'НАСТРОЙКИ',
      total_users: 'ВСЕГО ПОЛЬЗОВАТЕЛЕЙ',
      active_24h: 'АКТИВНЫЕ (24Ч)',
      new_7d: 'НОВЫЕ (7Д)',
      banned_stats: 'В БАНЕ',
      new_registrations: 'НОВЫЕ РЕГИСТРАЦИИ',
      view_all: 'СМОТРЕТЬ ВСЕХ',
      system_telemetry: 'ТЕЛЕМЕТРИЯ СИСТЕМЫ',
      connection_status: 'СТАТУС ПОДКЛЮЧЕНИЯ',
      latency: 'ПИНГ',
      cpu: 'ЗАГРУЗКА CPU',
      memory: 'ИСПОЛЬЗОВАНИЕ ОЗУ',
      connection: 'ПОДКЛЮЧЕНИЕ',
      target_ip: 'ЦЕЛЕВОЙ IP',
      port: 'ПОРТ',
      default_port: 'ПО УМОЛЧАНИЮ: 25565 [TCP/UDP]',
      rcon_port: 'RCON ПОРТ',
      default_rcon_port: 'ПО УМОЛЧАНИЮ: 25651 [TCP]',
      rcon_password: 'RCON ПАРОЛЬ',
      primary_endpoint: 'ОСНОВНАЯ ТОЧКА ТЕЛЕМЕТРИИ',
      save: 'СОХРАНИТЬ',
      saved: 'СОХРАНЕНО',
      notes: 'ЗАМЕТКИ',
      notes_text: [
        'Укажите IP игрового сервера для мониторинга в реальном времени.',
        'Обновление телеметрии происходит каждые 30 секунд.'
      ],
      logs: 'ЛОГИ',
      analytics: 'АНАЛИТИКА',
      launcher: 'ЛАУНЧЕР',
      launcher_upload: 'ЗАГРУЗИТЬ ЛАУНЧЕР',
      launcher_upload_hint:
        'Архив или .exe (макс. 150 МБ). На Cloudflare задайте LAUNCHER_DOWNLOAD_URL или R2 + LAUNCHER_PUBLIC_URL_BASE; загрузка в R2 — переменные LAUNCHER_R2_*.',
      launcher_select_file: 'ВЫБРАТЬ ФАЙЛ (.EXE / .ZIP / .7Z)',
      launcher_uploaded: 'Лаунчер загружен',
      launcher_not_uploaded: 'Не загружен',
      launcher_size: 'Размер',
      launcher_cdn: 'Файл лаунчера на CDN (R2)',
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  // Load saved language from localStorage on mount
  useEffect(() => {
    let savedLang: Language | null = null;
    try {
      savedLang = localStorage.getItem('warborn_lang') as Language;
    } catch (e) {
      console.warn('LocalStorage access denied', e);
    }
    if (savedLang && (savedLang === 'en' || savedLang === 'ru')) {
      setLanguage(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ru') {
        setLanguage('ru');
      } else {
        setLanguage('en');
      }
    }

  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('warborn_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
