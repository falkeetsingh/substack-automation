import fs from 'fs';
import {parse} from 'csv-parse';

export async function readTopics(csvPath){
    if(!fs.existsSync(csvPath)){
        throw new Error(`CSV file not found at path: ${csvPath}`);
    }

    const rows = await new Promise((resolve, reject) => {
        const out = [];
        fs.createReadStream(csvPath)
            .pipe(parse({columns: true, skip_empty_lines: true}))
            .on('data', row => out.push(row))
            .on('end', () => resolve(out))
            .on('error', err => reject(err));
    });

    //expect columns: sno,topic
    return rows
        .filter(r => r.topic)
        .map(r => ({ sn: r['s.no'] ?? r['S.No'] ?? r['S.NO'] ?? r.sno ?? '', topic: r.topic.trim() }));
}