import syllabusData from './syllabus/vtu_syllabus.json';

export type SyllabusModule = {
    code: string;
    credits: number;
    description: string;
    modules: string[];
    keywords: string[];
};

export type SyllabusData = {
    [scheme: string]: {
        [branch: string]: {
            [semester: string]: {
                [subjectName: string]: SyllabusModule;
            };
        };
    };
};

export const syllabus = syllabusData;
