/**
 * MathQuest - Banco de Macetes
 * ==============================
 * Cada macete tem: id, operacao, nível, nome,
 * descricao, tipo de animacao, e exemplo concreto.
 *
 * Os macetes sao o CORACAO pedagogico do sistema.
 */

const TricksDatabase = {
    adicao: [
        { id: 'add_zero',     nível: 1, nome: 'O Zero Invisivel',        desc: 'Qualquer número + 0 = ele mesmo',                 animType: 'ghost_fade',     exemplo: { a: 5, b: 0, result: 5 } },
        { id: 'add_commute',  nível: 1, nome: 'Troca-Troca',             desc: 'Trocar a ordem nao muda nada',                     animType: 'swap_groups',    exemplo: { a: 2, b: 3, result: 5 } },
        { id: 'add_doubles',  nível: 1, nome: 'Espelho',                 desc: 'Dobros: mesmo número + mesmo número',              animType: 'mirror',         exemplo: { a: 6, b: 6, result: 12 } },
        { id: 'add_near_dbl', nível: 2, nome: 'Quase Espelho',           desc: 'Quase-dobros: dobro + 1 ou - 1',                   animType: 'mirror_plus',    exemplo: { a: 6, b: 7, result: 13 } },
        { id: 'add_make_10',  nível: 2, nome: 'Completar 10',            desc: 'Quebrar um número pra formar 10 primeiro',         animType: 'decompose',      exemplo: { a: 8, b: 5, result: 13 } },
        { id: 'add_plus_10',  nível: 2, nome: 'Pular Dezena',            desc: 'Somar 10 e so trocar a dezena',                    animType: 'digit_change',   exemplo: { a: 17, b: 10, result: 27 } },
    ],
    subtracao: [
        { id: 'sub_zero',     nível: 1, nome: 'Zero Nao Leva Nada',      desc: 'Qualquer número - 0 = ele mesmo',                  animType: 'ghost_fade',     exemplo: { a: 7, b: 0, result: 7 } },
        { id: 'sub_self',     nível: 1, nome: 'Tudo Sai',                desc: 'Qualquer número - ele mesmo = 0',                  animType: 'empty_box',      exemplo: { a: 5, b: 5, result: 0 } },
        { id: 'sub_reverse',  nível: 1, nome: 'Rebobinar',               desc: 'Subtração e a adicao de tras pra frente',           animType: 'rewind',         exemplo: { a: 7, b: 4, result: 3 } },
        { id: 'sub_count_up', nível: 2, nome: 'Contar Pra Frente',       desc: 'Subtrair contando do menor ate o maior',           animType: 'jump_forward',   exemplo: { a: 15, b: 9, result: 6 } },
        { id: 'sub_from_10',  nível: 2, nome: 'Completar',               desc: 'O que falta pra chegar em 10 ou 100',              animType: 'fill_gap',       exemplo: { a: 10, b: 7, result: 3 } },
    ],
    multiplicacao: [
        { id: 'mul_repeated',  nível: 1, nome: 'Soma Repetida',          desc: 'Multiplicar e somar o mesmo número varias vezes',  animType: 'group_add',      exemplo: { a: 3, b: 4, result: 12 } },
        { id: 'mul_commute',   nível: 1, nome: 'Girar a Grade',          desc: 'Trocar a ordem nao muda nada',                     animType: 'grid_rotate',    exemplo: { a: 3, b: 4, result: 12 } },
        { id: 'mul_by2',       nível: 1, nome: 'O Dobro',                desc: 'Tabuada do 2 e sempre o dobro',                    animType: 'mirror',         exemplo: { a: 2, b: 7, result: 14 } },
        { id: 'mul_by5',       nível: 1, nome: 'Relogio de 5',           desc: 'Tabuada do 5 sempre termina em 0 ou 5',            animType: 'clock_jump',     exemplo: { a: 5, b: 7, result: 35 } },
        { id: 'mul_by10',      nível: 1, nome: 'Cola o Zero',            desc: 'Tabuada do 10 e so colocar zero no final',         animType: 'append_zero',    exemplo: { a: 10, b: 6, result: 60 } },
        { id: 'mul_by9',       nível: 2, nome: 'Truque dos Dedos',       desc: 'Tabuada do 9: baixa o dedo, esquerda=dezena, direita=unidade', animType: 'finger_trick', exemplo: { a: 9, b: 7, result: 63 } },
        { id: 'mul_by4',       nível: 2, nome: 'Dobro do Dobro',         desc: 'Multiplicar por 4 e dobrar duas vezes',            animType: 'double_double',  exemplo: { a: 4, b: 3, result: 12 } },
        { id: 'mul_distribute',nível: 3, nome: 'Quebrar e Juntar',       desc: 'Distribuir pra facilitar: 7x6 = 5x6 + 2x6',       animType: 'decompose_mul',  exemplo: { a: 7, b: 6, result: 42 } },
    ],
    divisao: [
        { id: 'div_by1',      nível: 1, nome: 'Caixa Unica',            desc: 'Dividir por 1 nao muda nada',                     animType: 'single_box',     exemplo: { a: 8, b: 1, result: 8 } },
        { id: 'div_self',     nível: 1, nome: 'Um Cada',                 desc: 'Dividir por si mesmo da sempre 1',                animType: 'individual_box', exemplo: { a: 5, b: 5, result: 1 } },
        { id: 'div_reverse',  nível: 1, nome: 'Desmontar',               desc: 'Divisão e a multiplicacao de tras pra frente',      animType: 'unmultiply',     exemplo: { a: 12, b: 3, result: 4 } },
        { id: 'div_by2',      nível: 1, nome: 'Metade',                  desc: 'Dividir por 2 e achar a metade',                   animType: 'split_half',     exemplo: { a: 14, b: 2, result: 7 } },
        { id: 'div_remainder',nível: 2, nome: 'O Orfao',                 desc: 'Quando nao cabe igual, sobra o orfao (resto)',     animType: 'orphan_item',    exemplo: { a: 13, b: 4, result: '3 resto 1' } },
        { id: 'div_by2_rule', nível: 2, nome: 'Par ou Ímpar',            desc: 'Divisivel por 2 se termina em 0,2,4,6,8',         animType: 'even_dance',     exemplo: { a: 24, b: 2, result: 12 } },
        { id: 'div_by5_rule', nível: 2, nome: 'Regra do 5',              desc: 'Divisivel por 5 se termina em 0 ou 5',            animType: 'five_check',     exemplo: { a: 35, b: 5, result: 7 } },
        { id: 'div_by3_rule', nível: 3, nome: 'Soma dos Digitos',        desc: 'Divisivel por 3 se soma dos digitos e divisivel por 3', animType: 'digit_sum',  exemplo: { a: 123, b: 3, result: 41 } },
    ]
};
