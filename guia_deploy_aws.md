# Guia Definitivo: Como Hospedar o AchoQ na AWS

Este guia foi criado para ser didático e direto ao ponto. Como o AchoQ é um aplicativo frontend moderno (construído com React e Vite), a maneira mais fácil, rápida e recomendada de hospedá-lo na AWS é utilizando o **AWS Amplify**.

O AWS Amplify é um serviço gerenciado que facilita muito a vida: ele pega o seu código, constrói (faz o *build*) e já distribui globalmente em uma CDN (Rede de Distribuição de Conteúdo), garantindo que o site carregue rápido em qualquer lugar do mundo.

---

## Passo 1: Exportar o Código do Manus

Antes de ir para a AWS, você precisa ter o código-fonte na sua máquina.

1. No painel lateral direito do Manus (Management UI), vá até a aba **Code** (Código).
2. Clique no botão para **Download all files** (Baixar todos os arquivos) ou baixe como ZIP.
3. Extraia o arquivo ZIP em uma pasta no seu computador (ex: `C:\Projetos\achoq_landing`).

---

## Passo 2: Subir o Código para o GitHub (Recomendado)

O AWS Amplify funciona melhor quando conectado a um repositório de código. Assim, toda vez que você atualizar o código no GitHub, a AWS atualiza o site automaticamente.

1. Crie uma conta no [GitHub](https://github.com/) (se não tiver).
2. Crie um novo repositório chamado `achoq-frontend` (pode ser Privado ou Público).
3. No seu computador, abra o terminal (ou Prompt de Comando/VS Code) na pasta onde você extraiu o código.
4. Execute os seguintes comandos para enviar o código para o GitHub:

```bash
git init
git add .
git commit -m "Versão inicial do AchoQ"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/achoq-frontend.git
git push -u origin main
```
*(Substitua `SEU_USUARIO` pelo seu nome de usuário no GitHub).*

---

## Passo 3: Configurar o AWS Amplify

Agora vamos para a sua conta da AWS.

1. Faça login no [Console da AWS](https://aws.amazon.com/pt/console/).
2. Na barra de pesquisa no topo, digite **Amplify** e clique no serviço "AWS Amplify".
3. Na tela inicial do Amplify, role para baixo e procure por **Amplify Hosting** (Hospedagem). Clique em **Get Started** (Começar) ou **Host web app**.
4. **Escolha a Fonte do Código:**
   - Selecione **GitHub** e clique em **Continue**.
   - A AWS pedirá autorização para acessar seu GitHub. Autorize.
5. **Selecione o Repositório:**
   - No menu suspenso, escolha o repositório que você acabou de criar (`achoq-frontend`).
   - A *Branch* (ramificação) deve ser a `main`.
   - Clique em **Next** (Próximo).
6. **Configurações de Build (Importante):**
   - O Amplify geralmente detecta automaticamente que é um projeto Node.js/Vite.
   - Ele vai mostrar um arquivo de configuração (YAML). Para o nosso projeto (que usa `pnpm` ou `npm`), a configuração padrão geralmente funciona, mas certifique-se de que os comandos de build estão corretos. O comando de build do nosso projeto é `npm run build` (ou `pnpm run build`), e a pasta de saída (baseDirectory) geralmente é `dist`.
   - *Nota:* Se o Amplify perguntar sobre a "Build image", deixe a padrão (Amazon Linux).
   - Clique em **Next**.
7. **Revisão:**
   - Revise as informações e clique em **Save and deploy** (Salvar e implantar).

---

## Passo 4: Aguardar a Mágica Acontecer

Agora a AWS fará três coisas automaticamente (você verá uma barra de progresso):
1. **Provision:** Prepara o servidor.
2. **Build:** Instala as dependências e compila o código React/Vite.
3. **Deploy:** Publica o site na internet.

Isso leva cerca de 2 a 3 minutos. Quando terminar, todos os ícones ficarão verdes e a AWS fornecerá um link temporário (algo como `https://main.d123456.amplifyapp.com`). 

**Clique no link! Seu site já está no ar.**

---

## Passo 5: Configurar seu Domínio Próprio (Opcional, mas recomendado)

Você não vai querer usar o link feio da AWS. Para usar `www.achoq.com.br`:

1. No menu lateral esquerdo do Amplify, clique em **Domain management** (Gerenciamento de domínio).
2. Clique em **Add domain** (Adicionar domínio).
3. Se você comprou o domínio no **AWS Route 53**, ele aparecerá na lista. Basta selecioná-lo e clicar em **Configure domain**.
4. Se você comprou em outro lugar (como Registro.br ou GoDaddy):
   - Digite seu domínio (ex: `achoq.com.br`).
   - A AWS vai gerar alguns registros **CNAME**.
   - Você precisará ir no painel do Registro.br (ou onde comprou o domínio), ir na área de "DNS" e adicionar esses registros CNAME que a AWS forneceu.
   - Após adicionar, a AWS vai verificar (pode levar algumas horas) e emitir um certificado SSL (o cadeado verde de segurança) automaticamente.

---

## Resumo das Vantagens desta Abordagem

| Característica | Benefício para o AchoQ |
| :--- | :--- |
| **Custo** | O Amplify tem um nível gratuito generoso. Para tráfego inicial, você pagará centavos ou nada. |
| **Performance** | O site é distribuído via CDN. Carrega instantaneamente em qualquer estado do Brasil. |
| **Manutenção** | Zero. Você não precisa atualizar servidores (EC2) nem se preocupar com Linux. |
| **Atualizações** | Fez uma mudança no código e deu `git push`? O site atualiza sozinho em 2 minutos. |

## Alternativa: S3 + CloudFront

Se você preferir não usar o Amplify e quiser a infraestrutura mais "raiz" da AWS:
1. Você precisaria rodar `npm run build` na sua máquina.
2. Pegar a pasta `dist` gerada.
3. Criar um **Bucket no Amazon S3**, habilitar "Static website hosting" e fazer upload dos arquivos.
4. Criar uma distribuição no **Amazon CloudFront** apontando para esse Bucket S3 para ter HTTPS e CDN.
*Nota: O Amplify faz exatamente isso por baixo dos panos, mas de forma automatizada. Por isso, recomendamos o Amplify para 99% dos casos.*
