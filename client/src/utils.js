// "Karim Haddad" -> "KH" (used for avatar circles until we add photos)
export function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
