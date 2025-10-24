// Utility functions for cookie management

export function setCookie(name: string, value: string, days: number = 365): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function setObjectCookie(name: string, obj: any, days: number = 365): void {
  try {
    const jsonString = JSON.stringify(obj);
    setCookie(name, jsonString, days);
  } catch (error) {
    console.error('Error setting object cookie:', error);
  }
}

export function getObjectCookie<T>(name: string): T | null {
  try {
    const cookieValue = getCookie(name);
    if (!cookieValue) return null;
    return JSON.parse(cookieValue) as T;
  } catch (error) {
    console.error('Error getting object cookie:', error);
    return null;
  }
}
