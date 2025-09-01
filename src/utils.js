export const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export function withRetry(fn, {retries= 3, delay = 1000} = {}){
    return async (...args) => {
        let lastErr;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn(...args);
            } catch (err) {
                lastErr = err;
                console.error(`Attempt ${i + 1} failed:`, err.message);
                if (i < retries - 1) {
                    await sleep(delay);
                }
            }
        }
    }
}