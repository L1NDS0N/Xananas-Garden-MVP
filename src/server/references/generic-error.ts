export type TGenericMessageParams = {
    subjectSingular: string;
    subjectPlural?: string;
    genre?: 'male' | 'fem';
}

export type TGenericMessage = ReturnType<typeof GENERIC_MESSAGES>;

type TGenericMessageContexts = {
    contexts: keyof TGenericMessage['error'];
}
type TGenericMessageCases = {
    cases: keyof TGenericMessage['error'][TGenericMessageContexts['contexts']]['case']
}

export type TGenericMessageArgs = TGenericMessageContexts & TGenericMessageCases & { field?: string};

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
                    is_empty: `Não há ${subjectSingular.toLowerCase()} cadastrad${pluralGenre}.`,
                    not_found: `${singGenre.toUpperCase()} ${subjectSingular} não foi encontrad${singGenre}.`,
                    cannot_delete: `Um erro ocorreu e não foi possível remover.`,
                    required_field: ($field: string) => (`O campo ${$field} é obrigatório.`),
                    unknow_error: ($field: string) => `Erro desconhecido durante ${$field}.`
                }
            },
        }
    }
}