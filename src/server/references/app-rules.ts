export const APP_RULES = {
	user: {
		_name: {
			notEmpty: {
				message: 'O campo de nome é requerido',
			},
			min: {
				val: 3,
				message: 'O tamanho mínimo do campo de nome é de 3 caracteres.',
			},
			max: {
				val: 40,
				message: 'O tamanho máximo do campo de nome é de 40 caracteres.',
			},
		},
		_email: {
			notEmpty: { message: 'O campo de email é requerido' },
			validation: { message: 'Formato de email inválido.' },
		},
		_username: {
			notEmpty: { message: 'O campo de apelido do usuário é requerido' },
			regex: {
				val: /^[a-zA-Z0-9._-]{3,20}$/,
				message: 'O formato do apelido de usuário é inválido.',
			},
		},
		_password: {
			notEmpty: { message: 'O campo de senha é requerido' },
			min: {
				val: 8,
				message: 'Tamanho mínimo do campo de senha é 8 caracteres.',
			},
			max: {
				val: 32,
				message: 'Tamanho máximo da senha é de 32 caracteres.',
			},
			regex: {
				_1st: {
					check: (password: string) => /[a-z]/.test(password),
					message: 'A Senha deve conter pelo menos uma letra minúscula.',
				},
				_2nd: {
					check: (password: string) => /[A-Z]/.test(password),
					message: 'A Senha deve conter pelo menos uma letra maiúscula.',
				},
				_3rd: {
					check: (password: string) => /\d/.test(password),
					message: 'A Senha deve conter pelo menos um número.',
				},
				_4th: {
					check: (password: string) => /\W/.test(password),
					message: 'A Senha deve conter pelo menos um caractere especial.',
				},
			},
		},
		_exceptions: {
			default: {
				context: {
					create: {
						message: 'Erro ao criar usuário. ',
					},
					update: {
						message: 'Erro ao atualizar usuário. ',
					},
					delete: {
						error: { message: 'Erro ao deletar usuário. ' },
						success: {
							message: 'Usuário deletado com sucesso.',
						},
					},
				},
			},
			case: {
				trying_to_update_another_user_info: {
					message:
						'Você não pode alterar informações de outro usuário sem ser um administrador do sistema.',
				},
				trying_to_use_an_email_that_already_exists: {
					message: 'Email já está sendo utilizado.',
				},
				trying_to_use_an_username_that_already_exists: {
					message: 'Username já está sendo utilizado.',
				},
			},
		},
	},
};
