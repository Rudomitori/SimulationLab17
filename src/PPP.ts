export function getDt(lambda: number): number {
    return - Math.log(Math.random())/lambda;
}

export function getProbability(m: number, t: number, lambda: number):number {
    let res = Math.pow(lambda * t, m);
    for(let i = 1; i <= m; i++) {
        res /= i
    }
    res *= Math.exp(-lambda * t)
    return res
}