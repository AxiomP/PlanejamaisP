-- ========================================
-- SEED: Dados Iniciais do Sistema
-- ========================================

-- Inserir alguns códigos BNCC de exemplo (Matemática 6º ano)
INSERT INTO bncc_codes (code, description, subject, grade_level, competence_area, full_description) VALUES
  ('EF06MA01', 'Comparar, ordenar, ler e escrever números naturais e números racionais', 'Matemática', '6º ano', 'Números', 'Comparar, ordenar, ler e escrever números naturais e números racionais cuja representação decimal é finita, fazendo uso da reta numérica.'),
  ('EF06MA02', 'Reconhecer o sistema de numeração decimal', 'Matemática', '6º ano', 'Números', 'Reconhecer o sistema de numeração decimal, como o que prevaleceu no mundo ocidental, e destacar semelhanças e diferenças com outros sistemas.'),
  ('EF06MA03', 'Resolver e elaborar problemas com números naturais', 'Matemática', '6º ano', 'Números', 'Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas, com compreensão dos processos neles envolvidos.'),
  ('EF06MA07', 'Compreender, comparar e ordenar frações', 'Matemática', '6º ano', 'Números', 'Compreender, comparar e ordenar frações associadas às ideias de partes de inteiros e resultado de divisão, identificando frações equivalentes.'),
  ('EF06MA08', 'Reconhecer que os números racionais positivos podem ser expressos nas formas fracionária e decimal', 'Matemática', '6º ano', 'Números', 'Reconhecer que os números racionais positivos podem ser expressos nas formas fracionária e decimal, estabelecer relações entre essas representações, passando de uma representação para outra, e relacioná-los a pontos na reta numérica.');

-- Inserir alguns códigos BNCC de Português 6º ano
INSERT INTO bncc_codes (code, description, subject, grade_level, competence_area, full_description) VALUES
  ('EF69LP01', 'Diferenciar liberdade de expressão de discursos de ódio', 'Língua Portuguesa', '6º ano', 'Leitura', 'Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia quando for o caso.'),
  ('EF69LP02', 'Analisar e comparar peças publicitárias', 'Língua Portuguesa', '6º ano', 'Leitura', 'Analisar e comparar peças publicitárias variadas, de forma a perceber a articulação entre elas em campanhas, as especificidades das várias semioses e mídias.'),
  ('EF69LP03', 'Identificar, em notícias, o fato central', 'Língua Portuguesa', '6º ano', 'Leitura', 'Identificar, em notícias, o fato central, suas principais circunstâncias e eventuais decorrências; em reportagens e fotorreportagens o fato ou a temática retratada e a perspectiva de abordagem.');

-- Inserir códigos BNCC de Geografia 6º ano
INSERT INTO bncc_codes (code, description, subject, grade_level, competence_area, full_description) VALUES
  ('EF06GE01', 'Comparar modificações das paisagens nos lugares de vivência', 'Geografia', '6º ano', 'O sujeito e seu lugar no mundo', 'Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.'),
  ('EF06GE02', 'Analisar modificações de paisagens por diferentes tipos de sociedade', 'Geografia', '6º ano', 'O sujeito e seu lugar no mundo', 'Analisar modificações de paisagens por diferentes tipos de sociedade, com destaque para os povos originários.');

-- Inserir códigos BNCC de História 6º ano
INSERT INTO bncc_codes (code, description, subject, grade_level, competence_area, full_description) VALUES
  ('EF06HI01', 'Identificar diferentes formas de compreensão da noção de tempo', 'História', '6º ano', 'História: tempo, espaço e formas de registros', 'Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos (continuidades e rupturas).'),
  ('EF06HI02', 'Identificar a gênese da produção do saber histórico', 'História', '6º ano', 'História: tempo, espaço e formas de registros', 'Identificar a gênese da produção do saber histórico e analisar o significado das fontes que originaram determinadas formas de registro em sociedades e épocas distintas.');

-- Inserir códigos BNCC de Ciências 6º ano
INSERT INTO bncc_codes (code, description, subject, grade_level, competence_area, full_description) VALUES
  ('EF06CI01', 'Classificar como vivo ou não vivo', 'Ciências', '6º ano', 'Matéria e energia', 'Classificar como vivo ou não vivo cada um dos componentes de um ecossistema, reconhecendo diferentes níveis de organização (célula, tecido, órgão, sistema e organismo).'),
  ('EF06CI02', 'Identificar e localizar as principais partes de uma célula', 'Ciências', '6º ano', 'Vida e evolução', 'Identificar e localizar as principais partes de uma célula (núcleo, citoplasma e membrana), reconhecendo sua organização e funções.');

-- Comentários
COMMENT ON TABLE bncc_codes IS 'Esses são apenas exemplos. Para produção, você deve popular com todos os códigos BNCC oficiais.';
