-- Gerado por scripts/generate-v311-assets.mjs. Não altera códigos históricos.

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Abraçadeira', base_code='MPAB',
  description_format='Abracadeira tipo <tipo> - <norma> <material> - Ø<diametro> para tubo <tubo> - origem', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","norma","material","diametro","tubo"]'::jsonb,
  example='Abracadeira tipo U - AISI 316 - Ø1/2" Para Tubo DN.16" - N', active=true, updated_at=now()
WHERE base_code='MPAB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Alojamento de MaxiChevron', base_code='PICA',
  description_format='Alojamento Para MaxiChevron - <material> - <módulo> <modelo>', characteristic_1='Material',
  characteristic_2='Modelo', code_formula='Código Base + Material + Modelo + Sequencial',
  required_fields='["material","módulo","modelo"]'::jsonb,
  example='Alojamento para MaxiChevron - 316L - 17615151 4.1125', active=true, updated_at=now()
WHERE base_code='PICA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Anel', base_code='MPAN',
  description_format='Anel - <material> - #<espessura> x <dimensoes> - <origem>', characteristic_1='Material',
  characteristic_2='Espessura Chapa', code_formula='Código Base + Material + Espessura Chapa + Sequencial',
  required_fields='["material","espessura","dimensoes","origem"]'::jsonb,
  example='Anel - 316L - #25,4mm x Ø555mm - Ø412mm - I', active=true, updated_at=now()
WHERE base_code='MPAN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Arame', base_code='MPAM',
  description_format='Arame - <material> - <diametro> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["material","diametro","origem"]'::jsonb,
  example='Arame - Inox 316 - Ø1,2mm - I', active=true, updated_at=now()
WHERE base_code='MPAM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Arruela', base_code='MPAR',
  description_format='Arruela <tipo> - <norma> <material> - Ø<diametro> <acabamento?> - origem', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","norma","material","diametro","acabamento"]'::jsonb,
  example='Arruela Lisa Serie Leve - SB-463 Alloy 20 - Ø9/16" - I', active=true, updated_at=now()
WHERE base_code='MPAR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Barra Chata', base_code='MPBC',
  description_format='Barra Chata - <Norma> <Material> - #<espessura>mm x <largura> - <origem>', characteristic_1='Material',
  characteristic_2='Espessura Chapa', code_formula='Código Base + Material + Espessura Chapa + Sequencial',
  required_fields='["Norma","Material","espessura","largura","origem"]'::jsonb,
  example='Barra Chata - SA-240 904L - #1/8"mm x 25,40 - I', active=true, updated_at=now()
WHERE base_code='MPBC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Barra Redonda', base_code='MPBR',
  description_format='Barra Redonda - <Norma> <Material> - Ø<diâmetro>" - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["Norma","Material","diâmetro","origem"]'::jsonb,
  example='Barra Redonda - SA-240 304 - Ø3/16" - I', active=true, updated_at=now()
WHERE base_code='MPBR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Barra Roscada', base_code='MPB0',
  description_format='Barra Roscada - <Norma> <Material> - Ø<diâmetro>" - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["Norma","Material","diâmetro","origem"]'::jsonb,
  example='Barra Roscada - AISI 304L - Ø1.1/4" - I', active=true, updated_at=now()
WHERE base_code='MPB0';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Bico Spray', base_code='MPBS',
  description_format='Bico Spray - <norma> <material> - Rosca Ø<diâmetro>" NPT - Saída Ø<saida>mm - <angulo>° - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["norma","material","diâmetro","saida","angulo","origem"]'::jsonb,
  example='Bico Spray - AISI 316L - Rosca Ø3/8" NPT - Saida Ø3,6mm - 120° - I', active=true, updated_at=now()
WHERE base_code='MPBS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Bobina (slit)', base_code='MPBO',
  description_format='Bobina - <norma> <material> - #<espessura> x <largura> - <origem>', characteristic_1='Material',
  characteristic_2='Espessura Slit', code_formula='Código Base + Material + Espessura Slit + Sequencial',
  required_fields='["norma","material","espessura","largura","origem"]'::jsonb,
  example='Bobina -SA-240 304L - #00,10mm x 303 - I', active=true, updated_at=now()
WHERE base_code='MPBO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Bomba', base_code='PIBO',
  description_format='Bomba <tipo> - Vazao <vazao> - Pressao <pressao> - <material> - <fabricante> <modelo> - Aplicacao <aplicacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["tipo","vazao","pressao","material","fabricante","modelo","aplicacao","ncp","tag","projeto"]'::jsonb,
  example='Bomba - NCP 1223.149 TAG 54655125', active=true, updated_at=now()
WHERE base_code='PIBO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Bubble Cap', base_code='PIBC',
  description_format='Bubble Cap - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PIBC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Bujão', base_code='MPBU',
  description_format='Bujão <tipo> - <Norma> <Material> - Ø<diâmetro>" - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","Norma","Material","diâmetro","origem"]'::jsonb,
  example='Bujao Sextavado - SA-182 F304L - Ø2" - N', active=true, updated_at=now()
WHERE base_code='MPBU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Cantoneira', base_code='MPCA',
  description_format='Cantoneira - <norma> <material> - <aba1> x <aba2> x <espessura> x <comprimento> - <origem>', characteristic_1='Material',
  characteristic_2='Espessura Chapa', code_formula='Código Base + Material + Espessura Chapa + Sequencial',
  required_fields='["norma","material","aba1","aba2","espessura","comprimento","origem"]'::jsonb,
  example='Cantoneira - SA-240 304 - 2.1/2" x 2.1/2" x 3/8" x 6000 - N', active=true, updated_at=now()
WHERE base_code='MPCA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='CAP', base_code='MPCP',
  description_format='CAP - <norma> <material> - NPS. <diametro> x <schedule> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["norma","material","diametro","schedule","origem"]'::jsonb,
  example='CAP - SA-182 304L - NPS. 4" SCH 40s - I', active=true, updated_at=now()
WHERE base_code='MPCP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Chapa', base_code='MPCH',
  description_format='Chapa - <Norma> <Material> - #<espessura>mm x <largura> x <comprimento> - <Acabamento> - <origem>', characteristic_1='Material',
  characteristic_2='Espessura Chapa', code_formula='Código Base + Material + Espessura Chapa + Sequencial',
  required_fields='["Norma","Material","espessura","largura","comprimento","Acabamento","origem"]'::jsonb,
  example='Chapa - SA-240 316L - #00,60mm x 1240 x 2000 - Laminado Quente - N', active=true, updated_at=now()
WHERE base_code='MPCH';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Chevron com Alojamento', base_code='PACA',
  description_format='MaxiChevron com Alojamento - <material> - <módulo> <modelo>', characteristic_1='Material',
  characteristic_2='Dimensão Característica', code_formula='Código Base + Material + Dimensão Característica + Sequencial',
  required_fields='["material","módulo","modelo"]'::jsonb,
  example='MaxiChevron com Alojamento - 316L - 35223184 3.1130', active=true, updated_at=now()
WHERE base_code='PACA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Chevron para Alojamento', base_code='PICL',
  description_format='MaxiChevron para Alojamento - <material> - <módulo> <modelo>', characteristic_1='Material',
  characteristic_2='Dimensão Característica', code_formula='Código Base + Material + Dimensão Característica + Sequencial',
  required_fields='["material","módulo","modelo"]'::jsonb,
  example='MaxiChevron Para Alojamento - 316L - 40021122 4.1125', active=true, updated_at=now()
WHERE base_code='PICL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Ciclone Fundido', base_code='PICI',
  description_format='Ciclone Fundido - <material> - <origem>', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["material","origem"]'::jsonb,
  example='Ciclone Fundido - 316L', active=true, updated_at=now()
WHERE base_code='PICI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Coletor', base_code='PACO',
  description_format='Coletor - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PACO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Consumível de Solda', base_code='MPCS',
  description_format='<tipo> Para Solda <máquina> - AWS 5.9 <material> - Ø<diametro> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro', code_formula='Código Base + Material + Diâmetro + Sequencial',
  required_fields='["tipo","máquina","material","diametro","origem"]'::jsonb,
  example='Vareta Para Solda TIG - AWS 5.9 SX - Ø2,4mm - N', active=true, updated_at=now()
WHERE base_code='MPCS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Cotovelo', base_code='MPCO',
  description_format='Cotovelo <tipo> <angulo> - <material> - <diametro1> <rosca1> x <diametro2> <rosca2> <classe de pressão> - <origin>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","angulo","material","diametro1","rosca1","diametro2","rosca2","classe de pressão","origin"]'::jsonb,
  example='Cotovelo Uniao 90° - 316L - OD 1/4" Dupla Anilha x OD 1/4" Dupla Anilha 6000# - N', active=true, updated_at=now()
WHERE base_code='MPCO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Curva', base_code='MPCV',
  description_format='Curva <angulo> <raio> - <norma> <material> - <diametro> <schedule> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubulação', code_formula='Código Base + Material + Diâmetro Tubulação + Sequencial',
  required_fields='["angulo","raio","norma","material","diametro","schedule","origem"]'::jsonb,
  example='Curva 45° RL - SA-403 TP304L - NPS 2" SCH 40s - I', active=true, updated_at=now()
WHERE base_code='MPCV';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Distribuidores', base_code='PAFL',
  description_format='Distribuidores - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PAFL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Espaçadores', base_code='MPES',
  description_format='Tubo Espaçador - <norma> <material> - NPS <diametro> <espessura> <comprimento> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["norma","material","diametro","espessura","comprimento","origem"]'::jsonb,
  example='Tubo Espacador - Inox 304L - Ø3/8" x #1mm x 30 - I', active=true, updated_at=now()
WHERE base_code='MPES';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Estojo', base_code='MPET',
  description_format='Estojo - <norma> <material> - Ø<diametro> x <comprimento> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["norma","material","diametro","comprimento","origem"]'::jsonb,
  example='Estojo - AISI 317L - Ø1/2" x 200 - I', active=true, updated_at=now()
WHERE base_code='MPET';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='FiberBed', base_code='PAFB',
  description_format='FiberBed <tipo> <modelo> <fixação> - Grade <material grade> - Leito <material leito> - Fixações <material fixações>', characteristic_1='Tipo',
  characteristic_2='Material Grade', code_formula='Código Base + Tipo + Material Grade + Sequencial',
  required_fields='["tipo","modelo","fixação","material grade","material leito","material fixações"]'::jsonb,
  example='FiberBed BD SingleBed 20.20.120 SRF - Grade 316L - Leito FV - Fixações 316L', active=true, updated_at=now()
WHERE base_code='PAFB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Fio', base_code='MPFI',
  description_format='Fio - <norma> <material> - Ø<diametro> - <dureza> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fio', code_formula='Código Base + Material + Diâmetro Fio + Sequencial',
  required_fields='["norma","material","diametro","dureza","origem"]'::jsonb,
  example='Fio - SB-160 Niquel 200 - Ø0,015" - Duro - N', active=true, updated_at=now()
WHERE base_code='MPFI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Fio (SX)', base_code='PIFI',
  description_format='Fio (SX) - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PIFI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Flange', base_code='MPFL',
  description_format='Flange <tipo> - <norma do material> <material> - NPS <diametro nominal> <face> - <norma dimensional> #<classe de pressao> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","norma do material","material","diametro nominal","face","norma dimensional","classe de pressao","origem"]'::jsonb,
  example='Flange Sobreposto - SA-182 F304L - NPS 8" RF - ASME B16.5 #150 - N', active=true, updated_at=now()
WHERE base_code='MPFL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Flange Cover', base_code='PAFC',
  description_format='<modelo> / <material> / <diametro> / <classe> / <dreno>', characteristic_1='Modelo',
  characteristic_2='Material', code_formula='PAFC + Modelo(2) + Material(2) + Diâmetro(3) + Classe de Pressão(2) + Dreno(1)',
  required_fields='["modelo","material","diametro","classe","dreno"]'::jsonb,
  example='EconoGard / PVC / 2" / ANSI 150# / Sem dreno', active=true, updated_at=now()
WHERE base_code='PAFC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Gancho', base_code='PIGA',
  description_format='Gancho - <Tipo> - <material> - Ø<diametro> UNC x <comprimento>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["Tipo","material","diametro","comprimento"]'::jsonb,
  example='Gancho J-Bolt - 316L - Ø3/8" UNC x 83mm', active=true, updated_at=now()
WHERE base_code='PIGA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Grampo', base_code='MPGR',
  description_format='Grampo <tipo> - <norma> <material> - Ø<diametro> x <comprimento> <rosca> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","norma","material","diametro","comprimento","rosca","origem"]'::jsonb,
  example='Grampo U - AISI 316L - Ø1/2" x 1.1/4" UNC - I', active=true, updated_at=now()
WHERE base_code='MPGR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Intermediários FiberBed', base_code='PIFB',
  description_format='<equipamento> - FiberBed <Range> <Material> - <origem>', characteristic_1='Equipamento',
  characteristic_2='Material', code_formula='Código Base + Equipamento + Material + Sequencial',
  required_fields='["equipamento","Range","Material","origem"]'::jsonb,
  example='Anel de Reforco - FiberBed BD AISI 316L Modelos 18-25-XXX', active=true, updated_at=now()
WHERE base_code='PIFB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='J-Bolt', base_code='PIJB',
  description_format='Conjunto J-Bolt <material> <diametro>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["material","diametro"]'::jsonb,
  example='Conjunto J-Bolt 904L 3/8"', active=true, updated_at=now()
WHERE base_code='PIJB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Junta', base_code='MPJU',
  description_format='Junta <tipo> - <material> - Ø<diametro> x #<espessura> <lbs># - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","material","diametro","espessura","lbs","origem"]'::jsonb,
  example='Junta Full Face - PTFE - Ø24" x #3mm - 150# - N', active=true, updated_at=now()
WHERE base_code='MPJU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='L-Bolt', base_code='PILB',
  description_format='Conjunto L-Bolt <material> <diametro>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["material","diametro"]'::jsonb,
  example='Gancho L-Bolt 904L 3/8"', active=true, updated_at=now()
WHERE base_code='PILB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Limitadores', base_code='PALM',
  description_format='Limitadores - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PALM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Luva', base_code='MPLV',
  description_format='Luva <tipo> - <norma> <material> - NPS <diametro> NPT <lbs># B16.11 - <origin>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","norma","material","diametro","lbs","origin"]'::jsonb,
  example='Luva Roscada - SA-182 F304L - Ø1/2" NPT 3000# B16.11 - I', active=true, updated_at=now()
WHERE base_code='MPLV';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Malha', base_code='PIMA',
  description_format='Malha - <materiais> <complemento?> <Modelo?> - Ø<diametro do fio>" <n° agulha>N', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["materiais","complemento","Modelo","diametro do fio","n° agulha"]'::jsonb,
  example='Malha - SX - Ø0,006" 60N', active=true, updated_at=now()
WHERE base_code='PIMA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Malha Bgon', base_code='MPMB',
  description_format='Malha B-GON <material> <modelo> - <origem>', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["material","modelo","origem"]'::jsonb,
  example='Malha B-GON PP 08/96 - I', active=true, updated_at=now()
WHERE base_code='MPMB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='MaxiMesh', base_code='PAMM',
  description_format='MaxiMesh <modelo> <geometria> - Malha <material malha> Grade <Material Grade> - #<espessura>mm x <dimensão>', characteristic_1='Material da Malha',
  characteristic_2='Dimensão MaxiMesh', code_formula='Código Base + Material da Malha + Dimensão MaxiMesh + Sequencial',
  required_fields='["modelo","geometria","material malha","Material Grade","espessura","dimensão"]'::jsonb,
  example='MaxiMesh 326 Circular - Malha 304L - Grade 304L - #152mm x 1500', active=true, updated_at=now()
WHERE base_code='PAMM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='MaxiPac', base_code='PARE',
  description_format='Recheio Estruturado MaxiPac <modelo> - <material> - Ø<diametro>mm', characteristic_1='Material',
  characteristic_2='Diâmetro Mesh', code_formula='Código Base + Material + Diâmetro Mesh + Sequencial',
  required_fields='["modelo","material","diametro"]'::jsonb,
  example='Recheio Estruturado MaxiPac 200X - 316L - Ø5000mm', active=true, updated_at=now()
WHERE base_code='PARE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Meia Luva', base_code='MPML',
  description_format='Meia Luva - <norma> <material> - NPS <diametro> NPT <lbs># - <origin>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["norma","material","diametro","lbs","origin"]'::jsonb,
  example='Meia Luva - SA-182 F316L - NPS 1/2" NPT B16.11 6000# - I', active=true, updated_at=now()
WHERE base_code='MPML';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Parafuso', base_code='MPPA',
  description_format='Parafuso <tipo> Serie <serie> - <norma> <material> - Ø<diametro>" <rosca> Rosta Total x <comprimento> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","serie","norma","material","diametro","rosca","comprimento","origem"]'::jsonb,
  example='Parafuso Sextavado Serie Leve - F593 347 - Ø3/8" UNC Rosca Total x 3/4" - N', active=true, updated_at=now()
WHERE base_code='MPPA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Pestana', base_code='MPPE',
  description_format='Pestana <tipo> - <norma do material> <material> - <norma dimensional> NPS <diametro nominal> x #<espessura> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","norma do material","material","norma dimensional","diametro nominal","espessura","origem"]'::jsonb,
  example='Pestana - SA-240 310S - B16.9 NPS 4" x #4mm - I', active=true, updated_at=now()
WHERE base_code='MPPE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Plugue', base_code='MPPL',
  description_format='Plugue <tipo> - <norma> <material> - Ø<diametro> B16.11 #<pressão> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","norma","material","diametro","pressão","origem"]'::jsonb,
  example='Plugue Cabeca Quadrada - SA-182 304L - Ø3/4" B16.11 3000# - N', active=true, updated_at=now()
WHERE base_code='MPPL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Porca', base_code='MPPO',
  description_format='Porca <tipo> Serie <serie> - <norma> <material> - Ø<diametro> x <UNC> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","serie","norma","material","diametro","UNC","origem"]'::jsonb,
  example='Porca Sextavada Série Leve - F594 304 - Ø5/8" UNC - N', active=true, updated_at=now()
WHERE base_code='MPPO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Pultrudado', base_code='MPPU',
  description_format='Perfil Pultrudado <tipo> <cor> - <diametro> - <norma> <material> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["tipo","cor","diametro","norma","material","origem"]'::jsonb,
  example='Perfil Pultrudado I Amarelo - 1" - D3917M Fibra de Vidro - N', active=true, updated_at=now()
WHERE base_code='MPPU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Recheio Randomico', base_code='PARR',
  description_format='Recheio Aleatorio <modelo> <dimensão> <material>', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["modelo","dimensão","material"]'::jsonb,
  example='Recheio Aleatorio CMTP 25 316L', active=true, updated_at=now()
WHERE base_code='PARR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Redução', base_code='MPRE',
  description_format='Redução <tipo> - <norma> <material> - NPS <diametro1> x <diametro2> <Schedule> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","norma","material","diametro1","diametro2","Schedule","origem"]'::jsonb,
  example='Reducao Concentrica - SA-128 316L - NPS 10" x NPS 8" SCH 40s - N', active=true, updated_at=now()
WHERE base_code='MPRE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Sistema de Lavagem', base_code='PISL',
  description_format='Sistema de Lavagem para MaxiChevron - <material> - <módulo> <modelo>', characteristic_1='Material',
  characteristic_2='Modelo Alojamento', code_formula='Código Base + Material + Modelo Alojamento + Sequencial',
  required_fields='["material","módulo","modelo"]'::jsonb,
  example='Sistema de Lavage para MaxiChevron - 316L - 40021122 4.1125', active=true, updated_at=now()
WHERE base_code='PISL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Suporte', base_code='PASU',
  description_format='Suporte - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PASU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Tee', base_code='MPTE',
  description_format='TEE <tipo?> - <norma> <material> - <diameter> <schedule> - <origin>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["tipo","norma","material","diameter","schedule","origin"]'::jsonb,
  example='TEE - SA-403 304L - NPS 1.1/2" SCH 40s - I', active=true, updated_at=now()
WHERE base_code='MPTE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Tela Fiberbed', base_code='MPTF',
  description_format='Tela Fiberbed - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='MPTF';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Tijolo', base_code='PITI',
  description_format='Tijolo - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PITI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Tubo', base_code='MPTU',
  description_format='Tubo - <norma> <material> - <diametro> <schedule ou espessura> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["norma","material","diametro","schedule ou espessura","origem"]'::jsonb,
  example='Tubo - SA-312 904L - NPS 3" SCH 80s - N', active=true, updated_at=now()
WHERE base_code='MPTU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='União Roscada', base_code='MPUR',
  description_format='Uniao Roscada - <norma do material> <material> - <norma dimensional> <classe de pressao># NPS <diametro nominal> NPT - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Conexão', code_formula='Código Base + Material + Diâmetro Conexão + Sequencial',
  required_fields='["norma do material","material","norma dimensional","classe de pressao","diametro nominal","origem"]'::jsonb,
  example='Uniao Roscada - SA-182 316L - B16.11 3000# NPS 1.1/2" NPT - I', active=true, updated_at=now()
WHERE base_code='MPUR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='União Solda de Encaixe', base_code='MPUS',
  description_format='Uniao Solda de Encaixe - <norma do material> <material> - <norma dimensional> <classe de pressao># NPS <diametro nominal> SW - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["norma do material","material","norma dimensional","classe de pressao","diametro nominal","origem"]'::jsonb,
  example='Uniao Solda de Encaixe - SA-182 316L - B16.11 3000# NPS 2" SW - N', active=true, updated_at=now()
WHERE base_code='MPUS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Acabado'),
  name='Vaso', base_code='PAVA',
  description_format='Vaso - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PAVA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Visor', base_code='MPVI',
  description_format='Visor - <especificacao>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='MPVI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Intermediários LOV', base_code='PILO',
  description_format='<equipamento> - Lube Oil Vent <Característica?> <Posição?> - <origem>', characteristic_1='Equipamento',
  characteristic_2='Característica', code_formula='Código Base + Equipamento + Característica + Sequencial',
  required_fields='["equipamento","Característica","Posição","origem"]'::jsonb,
  example='Valvula Esfera - Lub Oil Vent 2" - N', active=true, updated_at=now()
WHERE base_code='PILO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Válvula', base_code='PIVA',
  description_format='Valvula <tipo> - <material> - DN <diametro> - Classe <classe> - <conexao> - <acionamento> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro de Tubulação', code_formula='Código Base + Material + Diâmetro de Tubulação + Sequencial',
  required_fields='["tipo","material","diametro","classe","conexao","acionamento","origem"]'::jsonb,
  example='Valvula Esfera - 316L - DN 2 - Classe 150 - Flangeada - Manual - N', active=true, updated_at=now()
WHERE base_code='PIVA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Instrumento', base_code='PIIN',
  description_format='Instrumento <tipo> - <variavel> - Faixa <faixa> - <conexao> - Sinal <sinal> - <fabricante> <modelo> - <origem>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["tipo","variavel","faixa","conexao","sinal","fabricante","modelo","origem"]'::jsonb,
  example='Instrumento Transmissor - Pressao - Faixa 0 a 10 bar - 1/2 NPT - Sinal 4-20mA - Fabricante Modelo - I', active=true, updated_at=now()
WHERE base_code='PIIN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Soprador', base_code='PISO',
  description_format='Soprador <tipo> - Vazao <vazao> - Pressao <pressao> - <material> - <fabricante> <modelo>', characteristic_1='',
  characteristic_2='', code_formula='Código Base + Sequencial',
  required_fields='["tipo","vazao","pressao","material","fabricante","modelo","tag"]'::jsonb,
  example='Soprador Centrifugo - Vazao 10000 m3/h - Pressao 500 mmca - Aco Carbono - Fabricante Modelo - TAG BL-001', active=true, updated_at=now()
WHERE base_code='PISO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Equipamentos para Revenda', base_code='REEQ',
  description_format='Equipamento para Revenda - <fabricante> <modelo> - <especificacao>', characteristic_1='Fabricante',
  characteristic_2='Modelo', code_formula='Código Base + Fabricante + Modelo + Sequencial',
  required_fields='["fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REEQ';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Peças e Componentes para Revenda', base_code='REPC',
  description_format='Peca ou Componente para Revenda - <fabricante> <modelo> - <especificacao>', characteristic_1='Fabricante',
  characteristic_2='Modelo', code_formula='Código Base + Fabricante + Modelo + Sequencial',
  required_fields='["fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REPC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Instrumentos para Revenda', base_code='REIN',
  description_format='Instrumento para Revenda - <tipo> - <fabricante> <modelo> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REIN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Válvulas para Revenda', base_code='REVA',
  description_format='Valvula para Revenda - <tipo> - <fabricante> <modelo> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REVA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Bombas para Revenda', base_code='REBO',
  description_format='Bomba para Revenda - <tipo> - <fabricante> <modelo> - <aplicacao>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","aplicacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REBO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Revenda'),
  name='Materiais Diversos para Revenda', base_code='REMD',
  description_format='Material para Revenda - <tipo> - <material> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='REMD';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Caixa', base_code='EMCA',
  description_format='Caixa - <material> - <largura> x <comprimento> - <capacidade>', characteristic_1='Material',
  characteristic_2='Largura', code_formula='Código Base + Material + Largura + Sequencial',
  required_fields='["material","largura","comprimento","capacidade"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMCA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Palete', base_code='EMPL',
  description_format='Palete - <material> - <largura> x <comprimento> - Capacidade <capacidade>', characteristic_1='Material',
  characteristic_2='Largura', code_formula='Código Base + Material + Largura + Sequencial',
  required_fields='["material","largura","comprimento","capacidade"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMPL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Engradado', base_code='EMEN',
  description_format='Engradado - <material> - <largura> x <comprimento> - Capacidade <capacidade>', characteristic_1='Material',
  characteristic_2='Largura', code_formula='Código Base + Material + Largura + Sequencial',
  required_fields='["material","largura","comprimento","capacidade"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMEN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Tambor', base_code='EMTA',
  description_format='Tambor - <material> - Capacidade <capacidade> - <tipo>', characteristic_1='Material',
  characteristic_2='Tipo', code_formula='Código Base + Material + Tipo + Sequencial',
  required_fields='["material","capacidade","tipo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMTA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Saco', base_code='EMSA',
  description_format='Saco - <material> - <largura> x <comprimento> - Capacidade <capacidade>', characteristic_1='Material',
  characteristic_2='Largura', code_formula='Código Base + Material + Largura + Sequencial',
  required_fields='["material","largura","comprimento","capacidade"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMSA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Embalagem'),
  name='Filme e Proteção', base_code='EMFP',
  description_format='Material de Protecao - <tipo> - <material> - <largura> x <comprimento>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","largura","comprimento"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='EMFP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Conjunto em Fabricação', base_code='PPCF',
  description_format='Conjunto em Fabricacao - <material> - <modelo> - Etapa <etapa>', characteristic_1='Material',
  characteristic_2='Modelo', code_formula='Código Base + Material + Modelo + Sequencial',
  required_fields='["material","modelo","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPCF';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Subconjunto', base_code='PPSU',
  description_format='Subconjunto - <material> - <modelo> - Etapa <etapa>', characteristic_1='Material',
  characteristic_2='Modelo', code_formula='Código Base + Material + Modelo + Sequencial',
  required_fields='["material","modelo","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPSU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Peça Usinada', base_code='PPPU',
  description_format='Peca Usinada - <material> - <desenho> - Etapa <etapa>', characteristic_1='Material',
  characteristic_2='Desenho', code_formula='Código Base + Material + Desenho + Sequencial',
  required_fields='["material","desenho","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPPU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Peça Soldada', base_code='PPPS',
  description_format='Peca Soldada - <material> - <desenho> - Etapa <etapa>', characteristic_1='Material',
  characteristic_2='Desenho', code_formula='Código Base + Material + Desenho + Sequencial',
  required_fields='["material","desenho","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPPS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Montagem Parcial', base_code='PPMP',
  description_format='Montagem Parcial - <modelo> - Etapa <etapa>', characteristic_1='Modelo',
  characteristic_2='', code_formula='Código Base + Modelo + Sequencial',
  required_fields='["modelo","projeto","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPMP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Em Processo'),
  name='Revestimento em Processo', base_code='PPRP',
  description_format='Revestimento em Processo - <material> - <tipo> - Etapa <etapa>', characteristic_1='Material',
  characteristic_2='Tipo', code_formula='Código Base + Material + Tipo + Sequencial',
  required_fields='["material","tipo","etapa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='PPRP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Sub Produto'),
  name='Sucata Metálica', base_code='SBSM',
  description_format='Sucata Metalica - <material> - <forma> - <origem>', characteristic_1='Material',
  characteristic_2='Forma', code_formula='Código Base + Material + Forma + Sequencial',
  required_fields='["material","forma","origem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SBSM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Sub Produto'),
  name='Retalho de Chapa', base_code='SBRC',
  description_format='Retalho de Chapa - <material> - <espessura> - <dimensao>', characteristic_1='Material',
  characteristic_2='Espessura Chapa', code_formula='Código Base + Material + Espessura Chapa + Sequencial',
  required_fields='["material","espessura","dimensao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SBRC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Sub Produto'),
  name='Resíduo Reciclável', base_code='SBRR',
  description_format='Residuo Reciclavel - <material> - <tipo> - <origem>', characteristic_1='Material',
  characteristic_2='Tipo', code_formula='Código Base + Material + Tipo + Sequencial',
  required_fields='["material","tipo","origem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SBRR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Sub Produto'),
  name='Material Reaproveitável', base_code='SBMR',
  description_format='Material Reaproveitavel - <material> - <tipo> - <dimensao>', characteristic_1='Material',
  characteristic_2='Tipo', code_formula='Código Base + Material + Tipo + Sequencial',
  required_fields='["material","tipo","dimensao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SBMR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Sub Produto'),
  name='Subproduto de Processo', base_code='SBSP',
  description_format='Subproduto de Processo - <tipo> - <material> - <origem>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","origem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SBSP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Material de Escritório', base_code='UCME',
  description_format='Material de Escritorio - <tipo> - <marca> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Marca', code_formula='Código Base + Tipo + Marca + Sequencial',
  required_fields='["tipo","marca","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCME';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Material de Limpeza', base_code='UCML',
  description_format='Material de Limpeza - <tipo> - <marca> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Marca', code_formula='Código Base + Tipo + Marca + Sequencial',
  required_fields='["tipo","marca","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCML';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Equipamento de Proteção Individual', base_code='UCEP',
  description_format='EPI - <tipo> - <tamanho> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Tamanho', code_formula='Código Base + Tipo + Tamanho + Sequencial',
  required_fields='["tipo","tamanho","fabricante","modelo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCEP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Ferramenta de Consumo', base_code='UCFC',
  description_format='Ferramenta de Consumo - <tipo> - <fabricante> <modelo> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCFC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Lubrificante', base_code='UCLU',
  description_format='Lubrificante - <tipo> - <fabricante> <modelo> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCLU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Gás Industrial', base_code='UCGI',
  description_format='Gas Industrial - <tipo> - <pureza> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Pureza', code_formula='Código Base + Tipo + Pureza + Sequencial',
  required_fields='["tipo","pureza","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCGI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Material de Soldagem', base_code='UCMS',
  description_format='Material de Soldagem - <tipo> - <material> - <diametro>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","diametro"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCMS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Suprimento de TI', base_code='UCST',
  description_format='Suprimento de TI - <tipo> - <fabricante> <modelo> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='UCST';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Imóveis', base_code='AIIM',
  description_format='Imovel - <tipo de imovel> - <localidade> - <identificacao>', characteristic_1='Tipo de Imóvel',
  characteristic_2='', code_formula='Código Base + Tipo de Imóvel + Sequencial',
  required_fields='["tipo de imovel","localidade","identificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIIM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Máquinas e Equipamentos', base_code='AIME',
  description_format='Maquina ou Equipamento - <tipo> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","numero de serie"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIME';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Móveis e Utensílios', base_code='AIMU',
  description_format='Movel ou Utensilio - <tipo> - <material> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","fabricante","modelo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIMU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Veículos', base_code='AIVE',
  description_format='Veiculo - <tipo> - <fabricante> <modelo> - <ano> - Placa <placa>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","ano","placa"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIVE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Computadores e TI', base_code='AICT',
  description_format='Equipamento de TI - <tipo> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","numero de serie"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AICT';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Ferramentas', base_code='AIFE',
  description_format='Ferramenta - <tipo> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","numero de serie"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIFE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Instalações', base_code='AIIN',
  description_format='Instalacao - <tipo> - <localidade> - <identificacao>', characteristic_1='Tipo',
  characteristic_2='Localidade', code_formula='Código Base + Tipo + Localidade + Sequencial',
  required_fields='["tipo","localidade","identificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIIN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Equipamentos de Medição', base_code='AIEM',
  description_format='Equipamento de Medicao - <tipo> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","numero de serie"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIEM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Ativo Imobilizado'),
  name='Equipamentos de Laboratório', base_code='AIEL',
  description_format='Equipamento de Laboratorio - <tipo> - <fabricante> <modelo>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","numero de serie"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='AIEL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Advocacia', base_code='SEAV',
  description_format='Servico de Advocacia - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEAV';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Assessoria', base_code='SEAS',
  description_format='Servico de Assessoria - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEAS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Consultoria', base_code='SECO',
  description_format='Servico de Consultoria - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SECO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Manutenção', base_code='SEMN',
  description_format='Servico de Manutencao - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEMN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Paisagismo', base_code='SEPA',
  description_format='Servico de Paisagismo - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEPA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Engenharia', base_code='SEEN',
  description_format='Servico de Engenharia - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEEN';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Instalação e Montagem', base_code='SEIM',
  description_format='Servico de Instalacao e Montagem - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEIM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Transporte e Frete', base_code='SETF',
  description_format='Servico de Transporte ou Frete - <tipo de servico> - <origem> - <destino>', characteristic_1='Tipo de Serviço',
  characteristic_2='Modalidade', code_formula='Código Base + Tipo de Serviço + Modalidade + Sequencial',
  required_fields='["tipo de servico","modalidade","origem","destino","fornecedor"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SETF';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Calibração', base_code='SECA',
  description_format='Servico de Calibracao - <tipo de servico> - <equipamento> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Equipamento', code_formula='Código Base + Tipo de Serviço + Equipamento + Sequencial',
  required_fields='["tipo de servico","equipamento","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SECA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Inspeção Técnica', base_code='SEIT',
  description_format='Servico de Inspecao Tecnica - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEIT';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Treinamento', base_code='SETR',
  description_format='Servico de Treinamento - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SETR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Limpeza', base_code='SELI',
  description_format='Servico de Limpeza - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SELI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Segurança', base_code='SESG',
  description_format='Servico de Seguranca - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SESG';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='TI', base_code='SETI',
  description_format='Servico de TI - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SETI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Contabilidade', base_code='SECT',
  description_format='Servico de Contabilidade - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SECT';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Locação', base_code='SELO',
  description_format='Servico de Locacao - <tipo de servico> - <equipamento> - <periodo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Equipamento', code_formula='Código Base + Tipo de Serviço + Equipamento + Sequencial',
  required_fields='["tipo de servico","equipamento","periodo","fornecedor"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SELO';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='RH', base_code='SERH',
  description_format='Servico de RH - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SERH';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Beneficiamento', base_code='SEBM',
  description_format='Servico de Beneficiamento - <tipo de servico> - <material> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Material', code_formula='Código Base + Tipo de Serviço + Material + Sequencial',
  required_fields='["tipo de servico","material","escopo","fornecedor"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEBM';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Produtos Químicos', base_code='INPQ',
  description_format='Produto Quimico - <tipo> - <material> - <concentracao>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","concentracao","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INPQ';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Gases Industriais', base_code='INGI',
  description_format='Gas Industrial - <tipo> - <pureza> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Pureza', code_formula='Código Base + Tipo + Pureza + Sequencial',
  required_fields='["tipo","pureza","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INGI';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Lubrificantes', base_code='INLU',
  description_format='Lubrificante - <tipo> - <fabricante> <modelo> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INLU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Abrasivos', base_code='INAB',
  description_format='Abrasivo - <tipo> - <material> - <granulometria>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","granulometria"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INAB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Adesivos e Selantes', base_code='INAS',
  description_format='Adesivo ou Selante - <tipo> - <fabricante> <modelo> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INAS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Resinas', base_code='INRE',
  description_format='Resina - <tipo> - <fabricante> <modelo> - <embalagem>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INRE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Tintas e Revestimentos', base_code='INTR',
  description_format='Tinta ou Revestimento - <tipo> - <fabricante> <modelo> - <cor>', characteristic_1='Tipo',
  characteristic_2='Modelo', code_formula='Código Base + Tipo + Modelo + Sequencial',
  required_fields='["tipo","fabricante","modelo","cor","embalagem"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INTR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Insumos'),
  name='Materiais de Processo', base_code='INMP',
  description_format='Material de Processo - <tipo> - <material> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='INMP';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Taxas e Licenças', base_code='OTTL',
  description_format='Taxa ou Licenca - <tipo> - <orgao> - <referencia>', characteristic_1='Tipo',
  characteristic_2='Órgão', code_formula='Código Base + Tipo + Órgão + Sequencial',
  required_fields='["tipo","orgao","referencia"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTTL';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Despesas Diversas', base_code='OTDD',
  description_format='Despesa Diversa - <tipo> - <referencia> - <observacao>', characteristic_1='Tipo',
  characteristic_2='Referência', code_formula='Código Base + Tipo + Referência + Sequencial',
  required_fields='["tipo","referencia","observacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTDD';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Adiantamentos', base_code='OTAD',
  description_format='Adiantamento - <tipo> - <beneficiario> - <referencia>', characteristic_1='Tipo',
  characteristic_2='Beneficiário', code_formula='Código Base + Tipo + Beneficiário + Sequencial',
  required_fields='["tipo","beneficiario","referencia"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTAD';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Seguros', base_code='OTSE',
  description_format='Seguro - <tipo> - <seguradora> - <referencia>', characteristic_1='Tipo',
  characteristic_2='Seguradora', code_formula='Código Base + Tipo + Seguradora + Sequencial',
  required_fields='["tipo","seguradora","referencia"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTSE';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Multas e Encargos', base_code='OTME',
  description_format='Multa ou Encargo - <tipo> - <orgao> - <referencia>', characteristic_1='Tipo',
  characteristic_2='Órgão', code_formula='Código Base + Tipo + Órgão + Sequencial',
  required_fields='["tipo","orgao","referencia"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTME';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Brindes e Doações', base_code='OTBD',
  description_format='Brinde ou Doacao - <tipo> - <beneficiario> - <referencia>', characteristic_1='Tipo',
  characteristic_2='Beneficiário', code_formula='Código Base + Tipo + Beneficiário + Sequencial',
  required_fields='["tipo","beneficiario","referencia"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTBD';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Outros'),
  name='Materiais Não Classificados', base_code='OTMC',
  description_format='Material Nao Classificado - <tipo> - <material> - <especificacao>', characteristic_1='Tipo',
  characteristic_2='Material', code_formula='Código Base + Tipo + Material + Sequencial',
  required_fields='["tipo","material","especificacao"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='OTMC';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Manufatura', base_code='SEMA',
  description_format='Servico de Manufatura - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEMA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Serviços'),
  name='Administração', base_code='SEAD',
  description_format='Servico de Administração - <tipo de servico> - <area de aplicacao> - <escopo>', characteristic_1='Tipo de Serviço',
  characteristic_2='Área de Aplicação', code_formula='Código Base + Tipo de Serviço + Área de Aplicação + Sequencial',
  required_fields='["tipo de servico","area de aplicacao","escopo","fornecedor","periodo"]'::jsonb,
  example='', active=true, updated_at=now()
WHERE base_code='SEAD';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Uso e Consumo'),
  name='Consumível de Solda', base_code='UCCS',
  description_format='<tipo> Para Solda <máquina> - AWS 5.9 <material> - Ø<diametro> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro', code_formula='Código Base + Material + Diâmetro + Sequencial',
  required_fields='["tipo","máquina","material","diametro","origem"]'::jsonb,
  example='Vareta Para Solda TIG - AWS 5.9 SX - Ø2,4mm - N', active=true, updated_at=now()
WHERE base_code='UCCS';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Gancho', base_code='MPGA',
  description_format='Gancho - <Tipo> - <material> - Ø<diametro> UNC x <comprimento>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["Tipo","material","diametro","comprimento"]'::jsonb,
  example='Gancho J-Bolt - 316L - Ø3/8" UNC x 83mm', active=true, updated_at=now()
WHERE base_code='MPGA';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='J-Bolt', base_code='MPJB',
  description_format='Conjunto J-Bolt <material> <diametro>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["material","diametro"]'::jsonb,
  example='Conjunto J-Bolt 904L 3/8"', active=true, updated_at=now()
WHERE base_code='MPJB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='L-Bolt', base_code='MPLB',
  description_format='Conjunto L-Bolt <material> <diametro>', characteristic_1='Material',
  characteristic_2='Diâmetro Fixação', code_formula='Código Base + Material + Diâmetro Fixação + Sequencial',
  required_fields='["material","diametro"]'::jsonb,
  example='Gancho L-Bolt 904L 3/8"', active=true, updated_at=now()
WHERE base_code='MPLB';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Matéria Prima'),
  name='Recheio Randomico', base_code='MPRR',
  description_format='Recheio Aleatorio <modelo> <dimensão> <material>', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["modelo","dimensão","material"]'::jsonb,
  example='Recheio Aleatorio CMTP 25 316L', active=true, updated_at=now()
WHERE base_code='MPRR';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Tubo', base_code='PITU',
  description_format='Tubo - <norma> <material> - <diametro> <schedule ou espessura> - <origem>', characteristic_1='Material',
  characteristic_2='Diâmetro Tubo', code_formula='Código Base + Material + Diâmetro Tubo + Sequencial',
  required_fields='["norma","material","diametro","schedule ou espessura","origem"]'::jsonb,
  example='Tubo - SA-312 904L - NPS 3" SCH 80s - N', active=true, updated_at=now()
WHERE base_code='PITU';

UPDATE categories SET
  nature_id=(SELECT id FROM natures WHERE name='Produto Intermediário'),
  name='Recheio Randomico', base_code='PIRR',
  description_format='Recheio Aleatorio <modelo> <dimensão> <material>', characteristic_1='Material',
  characteristic_2='', code_formula='Código Base + Material + Sequencial',
  required_fields='["modelo","dimensão","material"]'::jsonb,
  example='Recheio Aleatorio CMTP 25 316L', active=false, updated_at=now()
WHERE base_code='PIRR';