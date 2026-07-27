export function truncateText(text: string, maxLength = 36): string {
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trimEnd()}…`;
}
