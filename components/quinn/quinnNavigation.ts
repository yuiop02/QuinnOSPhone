import type { AppScreen, NotificationTarget, QuinnSurfaceName } from './quinnTypes';

export function resolveNotificationTarget(target: NotificationTarget | string): AppScreen {
  if (target === 'TileExpandedCanvas' || target === 'GravityMicro') {
    return 'QuinnConversation';
  }

  if (target === 'LockScreen') {
    return 'SettingsHome';
  }

  if (target === 'QuinnConversation' || target === 'SettingsHome') {
    return target;
  }

  return target as AppScreen;
}

export function resolveSwitcherTarget(target: QuinnSurfaceName): AppScreen {
  if (
    target === 'LockScreen' ||
    target === 'TileExpandedCanvas' ||
    target === 'GravityMicro'
  ) {
    return 'SettingsHome';
  }

  return target as AppScreen;
}

export function getCurrentSwitcherSurface(screen: AppScreen): QuinnSurfaceName {
  if (screen === 'QuinnConversation' || screen === 'SettingsHome') {
    return 'HomeTileGrid';
  }

  return screen;
}
