export class TUserCredentialsJwtSignature {
    id!: string;
    userSecret!: string;
    admin!: boolean;

    constructor(obj?: Partial<TUserCredentialsJwtSignature>){
        Object.assign(this, obj);
    }
}