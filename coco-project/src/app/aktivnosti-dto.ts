export class ActivityDTO {

    ID: string;

    topic: string;
    subTopic: string;
    lessonRef: string;
    subTopicRef: string;

    numOfStudents: number[];
    configToTablet: string[];
    solvingTime: number;
    discussionTimes: number[];
    correctionTimes: number[];
      
    questions: string[];
    answers:{};

}
