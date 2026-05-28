
from app.routes_back.chatmessageDB_routes import createChatMessage
from testes.backups.llm_service import LLMService
from testes.llm_service.prompts import prompt3 as prompt
from testes.llm_service.questions import question2 as question_text

local = True

if (local):
    def getAnswertheQuery(chat_id: int, question_id: int, knowledge_area, query):
        """
            Dado um chat, uma questão, uma área de conhecimento e uma query, retorna a resposta da LLM
            considerando a questão, o histórico de mensagens relacionados à questão e a consulta do usuário.
        """

        history = [
            ("user", "Eu acho que é o item E!"),
            ("assistant", "Alternativa incorreta, a alternativa correta é o item A!"),
            ("user", "Poderia me explicar essa questão?"),
            ("assistant", """
                Olá! Vamos analisar essa questão com bastante atenção para que você compreenda o conceito por completo.

                ### 1. 🎯 Veredicto Imediato
                Você **errou** a questão. A alternativa correta é a **A**.

                ### 2. 🔑 Conceito Central Avaliado
                Esta questão avalia a compreensão sobre **Corredores Ecológicos** e seu papel fundamental na **recuperação da biodiversidade**, focando especificamente nos mecanismos biológicos que tornam essa estratégia efetiva. O conceito-chave aqui é o **fluxo gênico**.

                ### 3. ✅ Por que a alternativa correta está certa
                A alternativa **a) propicia o fluxo gênico** está correta porque:

                1.  **Fragmentação de Ecossistemas:** O texto introdutório explica que corredores ecológicos visam mitigar os efeitos da fragmentação. A fragmentação isola populações de uma mesma espécie em "ilhas" de habitat, impedindo o contato entre elas.
                2.  **Função dos Corredores:** Ao conectar diferentes áreas, os corredores permitem o deslocamento de animais e a dispersão de sementes.
                3.  **Consequência Biológica:** Quando animais de populações diferentes conseguem se encontrar e se reproduzir, ocorre a troca de material genético entre essas populações. Esse processo é chamado de **fluxo gênico**.
                4.  **Importância do Fluxo Gênico:** O fluxo gênico é crucial para a recuperação e manutenção da biodiversidade porque:
                    *   **Aumenta a Variabilidade Genética:** Introduz novos genes em populações isoladas, aumentando sua diversidade genética.
                    *   **Reduz a Endogamia:** Evita o cruzamento entre indivíduos aparentados (endogamia), que pode levar à diminuição da aptidão e à manifestação de características genéticas indesejáveis.
                    *   **Melhora a Capacidade de Adaptação:** Populações com maior variabilidade genética têm mais chances de possuir indivíduos com características que lhes permitam sobreviver e se reproduzir em face de mudanças ambientais (doenças, alterações climáticas, etc.).
                    *   **Fortalece as Populações:** Populações geneticamente mais diversas são mais robustas e resilientes, contribuindo para a recuperação efetiva da biodiversidade.

                ### 4. ❌ Por que a alternativa do estudante está errada
                Você escolheu a alternativa **e) favorece a formação de ilhas de proteção integral**. Este raciocínio está incorreto porque:

                *   **Ilhas de Proteção Integral:** "Ilhas de proteção integral" são áreas isoladas e protegidas, como parques nacionais ou reservas biológicas, que não permitem a intervenção humana direta.
                *   **Objetivo dos Corredores:** O texto afirma que os corredores ecológicos visam "mitigar os efeitos da fragmentação dos ecossistemas". A fragmentação é justamente o processo que *cria* essas "ilhas" de habitat, isolando populações.
                *   **Contrário ao Propósito:** O propósito dos corredores é *conectar* essas áreas isoladas, ou seja, *combater* o isolamento e a formação de novas "ilhas" (no sentido de isolamento genético), e não favorecê-las. Eles ligam o que já existe, impedindo que se tornem ainda mais isolados. Portanto, a alternativa "e" descreve o problema que os corredores buscam resolver, e não a solução.

                ### 5. 📌 Regra de Ouro / Memorização
                Lembre-se: **Corredores ecológicos são pontes, não muros.** Eles **conectam** habitats fragmentados para permitir o **fluxo gênico**, que é a chave para aumentar a **diversidade genética** e, consequentemente, a **resiliência e recuperação da biodiversidade**.

                ### 6. 🔁 Conexão com o Edital / Recorrência do Tema
                Questões sobre corredores ecológicos, fragmentação de habitats e conservação da biodiversidade são muito recorrentes em provas como o ENEM e vestibulares. Elas se encaixam na área de **Ecologia e Ciências Ambientais**, frequentemente abordando temas como sustentabilidade, impacto ambiental e estratégias de conservação. É fundamental entender os mecanismos biológicos por trás dessas estratégias.

                Continue firme nos estudos! Cada erro é uma oportunidade de aprofundar seu conhecimento e se tornar ainda mais preparado.
            """
            )
        ] 

        llm_service = LLMService(
            'google',
            0,
            prompt=prompt,
            history=history
        )

        call_dict = {
            'knowledge_area': knowledge_area,
            'question': question_text,
            'query': query
        }

        return llm_service.call_agent(**call_dict)
else:
    from app.routes_back.llm_routes import getAnswertheQuery




if __name__ == "__main__":
    
    query = input("Digite sua consulta: ") 

    # createChatMessage(5, 'user', query, 2)

    answ = getAnswertheQuery(
        chat_id=5,
        question_id=2,
        knowledge_area="Matemática e suas tecnologias",
        query=query
    )

    # createChatMessage(5, 'llm', answ, 2)


    print(answ)     
