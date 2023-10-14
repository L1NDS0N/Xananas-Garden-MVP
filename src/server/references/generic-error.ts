export type TGenericMessageParams = {
    subjectSingular: string;
    subjectPlural?: string;
    genre?: 'male' | 'fem';
}

export const GENERIC_MESSAGES = ({ subjectSingular, subjectPlural, genre }: TGenericMessageParams) => {
    genre = genre ?? 'male';
    subjectPlural = subjectPlural ?? subjectSingular;
    function ifGenre(maleString: string, femaleString: string) {
        return genre === 'male' ? maleString : femaleString;
    }
    const pluralGenre = ifGenre('os', 'as');
    const singGenre = ifGenre('o', 'a');

    return {
        error: {
            repository: {
                case: {
                    is_empty: `Não há ${subjectSingular} foram encontrad${pluralGenre}.`,
                    not_found: `${singGenre.toUpperCase()} ${subjectSingular} não foi encontrad${singGenre}.`,
                    required_field: ($field: string) => `O campo ${$field} é obrigatório.`
                }
            },
        }
    }
}

export type TGenericMessage = ReturnType<typeof GENERIC_MESSAGES>;

type TGenericMessageContexts = {
    contexts: keyof TGenericMessage['error'];
}
type TGenericMessageCases = {
    cases: keyof TGenericMessage['error'][TGenericMessageContexts['contexts']]['case']
}

export type TGenericMessageArgs = TGenericMessageContexts & TGenericMessageCases;