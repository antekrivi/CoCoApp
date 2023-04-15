export class ActivityDTO {

    ID: string;

    topic: string;
    subTopic: string;
    lessonRef: string;
    subTopicRef: string;

    numOfStudents: number[];
    configToTablet: string[];
    times: { correction: number | null; discussion: number | null; solving: number | null; } = {
        correction: null,
        discussion: null,
        solving: null,
      };
      
    questions: string[];
    answers:{};

}
