import fs from 'fs';
import path from 'path';
import { Timetables, Subject, Unit } from './server3/src/utils/interfaces';
import { extractData } from './server3/src/timetable/tt_parser';
import { updateSubjects, getSubject } from './server3/src/subjects/subjects_butler';

console.log('Start parser');

const ttFile = path.resolve(process.cwd(), 'unstf.txt');
const htmlFile = path.resolve(process.cwd(), 'src', 'emptyHtml.html');
if (!fs.existsSync(ttFile)) {
    throw ("Cannot find 'unstf.txt'!");
}

let raw: String;
let parsed: string[];
try {
    raw = fs.readFileSync(ttFile, 'latin1').toString();
    parsed = raw.replace(/\"/g, '').split('\n');
} catch (e) {
    throw ("Failed to read json!\nIn 'timetable.json' must be the parsed timetable in the VsaApp/Server3 Timetables format!\n"+e);
}

let json: Timetables;
try {
    json = extractData(parsed);
} catch (e) {
    throw ("Failed to parse json!\nThe 'timetable.json' must has hte format from VsaApp/Server3 Timetables!\n" + e);
}

let html = fs.readFileSync(htmlFile).toString();

try {
    html = html.replace('Timetable', `Timetable ${json.date}`);
    Object.keys(json.grades).forEach((grade: string) => {
        const timetable = json.grades[grade];
        html += `<table id="t01"><tr><th>${grade.toUpperCase()}</th>`;
        for (var i = 0; i < 5; i++) {
            html += `<th>${new Date(`11 ${18 + i} 2019`).toLocaleDateString('en-EN', { weekday: 'long' })}</th>`;
        }
        html += '</tr>'
        for (var i = 0; i < 8; i++) {
            const line: (Unit | undefined)[] = [undefined, undefined, undefined, undefined, undefined];
            for (var j = 0; j < 5; j++) {
                if (timetable.data.days[j].units.length > i && timetable.data.days[j].units[i]) {
                    line[j] = timetable.data.days[j].units[i];
                }
            }
            if (line.filter((u) => u).length > 0) {
                html += `<tr><td class="unit">${i + 1}</td>`;
                for (var j = 0; j < 5; j++) {
                    const unit = line[j];
                    if (!unit) html += '<td></td>';
                    else {
                        html += `<td class="subjects">${unit.subjects.map((s) => {
                            const course = s.courseID.includes('|') ? '' : s.courseID.split('-')[1].toLocaleUpperCase();
                            return `${s.block} - ${s.courseID} - <b>${s.subjectID}</b> ${course} ${s.teacherID.toUpperCase().length > 0 ? `(${s.teacherID.toUpperCase()})`
                                : ''}`;
                        }).join('<br>')}</td>`;
                    }
                }
                html += '</tr>';
            }
        }

        html += '</table><br>'
    });
} catch (_) {
    throw ("Failed to convert json!\nThe 'timetable.json' must has the format from VsaApp/Server3 Timetables!");
}

html += '<body>';

const resultPath = path.resolve(process.cwd(), 'timetable.html');
fs.writeFileSync(resultPath, html);
console.log('Finished!\nSaved file at ' + resultPath);