// User ki search string ko regex mein dalne se pehle special characters (. * + ( ) [ ] wagera) ko "normal" bana deta hai.
// Warna koi bhi jaan-boojh kar mehnga/ kharab pattern bhej kar server ko sust ya crash kar sakta hai (ReDoS).
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');