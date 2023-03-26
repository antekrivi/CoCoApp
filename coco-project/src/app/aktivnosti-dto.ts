import { DocumentReference } from "firebase/firestore";

export interface AktivnostiDTO {

    ID: string;
    lekcija: string;
    Vrijeme: Map<string, number>;
    Razred: string;
    BrojTableta: number;
    BrojUcenika: number;

}
