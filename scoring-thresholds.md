# Scoring Thresholds

## Mercado

- Equipa marcar +1,5 golos

## A. Mercado

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| Prob. +1,5 (equipa) | 25 | >=70->25 good · >=60->25 good · >=55->20 good · >=50->15 warn · >=45->10 warn · >=40->5 warn · >=0->0 bad | high |
| Prob. +2,5 (equipa) | 8 | >=45->8 good · >=38->6 good · >=30->4 warn · >=22->2 warn · >=0->0 bad | high |

## B. Producao & consistencia

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| Golos marcados/jogo | 10 | >=2.0->10 good · >=1.6->8 good · >=1.3->6 warn · >=1.1->4 warn · >=0.9->2 bad · >=0->0 bad | high |
| % jogos a marcar | 7 | >=90->7 good · >=80->6 good · >=70->4 warn · >=60->2 warn · >=0->0 bad | high |
| % jogos 2+ golos | 8 | >=60->8 good · >=50->6 good · >=40->4 warn · >=30->2 warn · >=0->0 bad | high |

## C. Criacao & finalizacao

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| Remates/jogo | 6 | >=14->6 good · >=12->4 warn · >=10->2 warn · >=0->0 bad | high |
| Remates enquadrados/jogo | 6 | >=5.5->6 good · >=4.5->4 warn · >=3.5->2 warn · >=0->0 bad | high |
| Conversao SOT | 6 | >=0.38->6 good · >=0.32->4 warn · >=0.25->2 warn · >=0->0 bad | high |

## D. Ritmo & pressao

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| % golo 1a parte | 4 | >=65->4 good · >=55->3 warn · >=45->2 warn · >=35->1 warn · >=0->0 bad | high |
| Diferenca de cantos | 4 | >=2->4 good · >=1->3 warn · >=0->2 warn · >=-1->1 warn · >=-999->0 bad | high |

## E. Fragilidade do adversario

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| GA adversario/jogo | 4 | >=1.7->4 good · >=1.4->3 warn · >=1.2->2 warn · >=1.0->1 warn · >=0->0 bad | high |
| % clean sheets adversario | 3 | <=25->3 good · <=35->2 warn · <=45->1 warn · <=100->0 bad | low |
| SOT sofridos adv./jogo | 3 | >=5.0->3 good · >=4.2->2 warn · >=3.5->1 warn · >=0->0 bad | high |

## F. Contexto

| Item | Max | Thresholds (valor -> pontos/status) | Direcao |
| --- | ---: | --- | --- |
| Delta ELO | 4 | >=80->4 good · >=40->3 warn · >=10->2 warn · >=-10->1 warn · >=-999->0 bad | high |
| Linha O/U base | 2 | >=3.0->2 good · >=2.75->1 warn · >=0->0 bad | high |

## Penalizacoes

| Item | Pontos | Condicao |
| --- | ---: | --- |
| Disciplina (risco de cartoes) | -5 | disciplineFlag = true |
