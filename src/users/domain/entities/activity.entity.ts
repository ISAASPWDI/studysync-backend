export class Activity {
    constructor(
        public lastActive: Date,
        public isOnline: boolean = true,
        public joinDate: Date,
        public profileCompletion: number
    ) { }
}