import { AxiosError } from "axios";

export default function handleKnownError(error: any, exec: (errorMessage: string) => void){    
    if (error instanceof AxiosError){
        exec(error.response?.data.error);
    } else if (error instanceof Error) {
        exec(error.message)
    } else {
        exec('Erro desconhecido. '+ error?.message)
    }
}