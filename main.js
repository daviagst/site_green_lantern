import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const container = document.querySelector('.anel-3d')

//CENA: modelo e luzes
const scene = new THREE.Scene()

//Camera
const camera = new THREE.PerspectiveCamera(
  45, container.clientWidth / container.clientHeight, 0.1, 100
)

camera.position.z = 5

//Fundo transparente
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
})

renderer.setSize(container.clientWidth, container.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

//Luz geral e uma luz forte vindo da frente
const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x203020, 2)
scene.add(luzAmbiente)

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 4)
luzPrincipal.position.set(3,4,5)
scene.add(luzPrincipal)

//Grupo que usaremos para movimentar o anel
const grupoAnel = new THREE.Group()
scene.add(grupoAnel)

const abertura = document.querySelector('.abertura')

//Deslocamento vertical definido pelo o scroll
const movimentoAnel = {y: 0}

function celular(){
  return window.matchMedia('(max-width: 767px), ' + '(max-width: 1366px) and (orientation: portrait), ' + '(max-width: 1023px) and (max-height: 500px)').matches
}

function valorLayout(nome){
  return getComputedStyle(abertura).getPropertyValue(nome).trim()
}

function alturaVisivel3D(){
  return 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
}

// Limita o tamanho do anel pela largura disponível
function tamanhoAnel(tamanhoDesktop){
  const altura = alturaVisivel3D()
  const largura = altura * camera.aspect

  if (celular()) {
    return Math.min(tamanhoDesktop, largura * 0.5, altura * 0.22)
  }
  return Math.min(tamanhoDesktop, largura * 0.38)
}

function tamanhoAnelDescricao() {
  if (celular()) {
    return Math.min(
      tamanhoAnel(1.8),
      alturaVisivel3D() * 0.22
    )
  }

  return tamanhoAnel(1.8)
}

function excessoDescricao(){
  if(!celular()) return 0

  const paragrafo = document.querySelector('.descricao-tropa')
  const limite = abertura.clientHeight - 32

  return Math.max(0, paragrafo.offsetTop + paragrafo.offsetHeight - limite)
}

const loader = new GLTFLoader()

loader.load(
  './arquivos3D/green_lantern_ring.glb',

  (gltf) => {
    const modelo = gltf.scene

    //Descobre as dimensões originais do modelo
    const caixa = new THREE.Box3().setFromObject(modelo)
    const tamanho = caixa.getSize(new THREE.Vector3())
    const centro = caixa.getCenter(new THREE.Vector3())

    // Coloca o centro do modelo na origem
    modelo.position.sub(centro)

    //Ajusta o tamanho sem depender da escala do arquivo
    const maiorDimensao = Math.max(tamanho.x, tamanho.y, tamanho.z)

    grupoAnel.add(modelo)

    grupoAnel.rotation.set(
      THREE.MathUtils.degToRad(55),
      THREE.MathUtils.degToRad(-20),
      THREE.MathUtils.degToRad(-10)
    )

    const escalaInicial = 0.4 / maiorDimensao
    const escalaFinal = () => tamanhoAnel(1.4) / maiorDimensao

    grupoAnel.scale.setScalar(escalaInicial)

    const timeline = gsap.timeline({
      defaults: {
        ease: 'none'
      },

      scrollTrigger: {
        trigger: '.abertura',
        start: 'top top',
        end: () => `+=${window.innerHeight * 5}`,
        pin: true,
        scrub: 1, 
        invalidateOnRefresh: true
      }
    })

    //O aviso desaparece no inicio da rolagem
    timeline.to('.aviso-scroll', {
      opacity: 0, 
      duration: 0.1
    }, 0)

    // O símbolo diminui a opacidade suavemente
    timeline.to('.simbolo', {
      opacity: 0.1,
      duration: 0.9
    }, 0)


    //Depois o anel cresce
    timeline.to(grupoAnel.scale, {
      x: escalaFinal,
      y: escalaFinal,
      z: escalaFinal,
      duration: 0.7
    }, 0.8)

    timeline.fromTo(
      '.titulo-esquerda',
      {
        x: () => celular() ? 0 : -60,
        x: () => celular() ? 16 : 0,
        opacity: 0
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.6
      },
      '>'
    )

    timeline.fromTo(
      '.titulo-direita',
      {
        x: () => celular() ? 0 : 60,
        y: () => celular() ? 16 : 0,
        opacity: 0
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.6
      },
      '<'
    )

    //pequeno intervalo de scroll para o titulo ter mais tempo de tela
    timeline.addLabel('descricao', '+=0.3')

    //Titulo centralizadoa a direita no inicio; alinhado a esquerda na descrição
    timeline.set('.titulo-direita', {
      textAlign: () => celular() ? 'center' : 'left',
    }, 'descricao')

    //Retira "TROPA DOS"
    timeline.to('.titulo-esquerda', {
      opacity: 0,
      x: () => celular() ? 0 : -40,
      y: () => celular() ? -12 : 0,
      duration: 0.3
    }, 'descricao')

    //O anel sai do centro e vai para a parte esquerda do site
    timeline.to(grupoAnel.position, {
      x: () => {
        if(celular()) return 0

        const larguraVisivel = alturaVisivel3D() * camera.aspect
        return -larguraVisivel * 0.12
      }, 
      duration: 1
    }, 'descricao')

    timeline.to(grupoAnel.scale, {
      x: () => tamanhoAnelDescricao() / maiorDimensao,
      y: () => tamanhoAnelDescricao() / maiorDimensao,
      z: () => tamanhoAnelDescricao() / maiorDimensao,
      duration: 1
    }, 'descricao')

    // No celular, sobe o anel para liberar espaço para o texto
    timeline.to(movimentoAnel, {
      y: () => celular() ? alturaVisivel3D() * 0.25 : 0,
      duration: 1
    }, 'descricao')

    // Leva o titulo para cima da descrição
    // Usa a mesma largura e margem direita do paragrafo
    timeline.fromTo(
      '.titulo-direita', 
      {
        top: () => valorLayout('--titulo-top-inicial'),
        right: () => valorLayout('--titulo-direita-inicial'),
        width: () => valorLayout('--titulo-largura-inicial')
      },
      {
        top: () => valorLayout('--titulo-top-descricao'),
        right: () => valorLayout('--titulo-direita-descricao'),
        width: () => valorLayout('--titulo-largura-descricao'),
        textAlign: () => celular() ? 'center' : 'left',
        x: 0,
        duration: 1,
        immediateRender: false
      },
      'descricao'
    )

    //Revela a descrição com um pequeno movimento para cima
    timeline.fromTo('.descricao-tropa', {
      y: 20,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      duration: 0.7
    }, 'descricao+=0.3')


    // Primeiro mantém as informações paradas para leitura
    timeline.to({}, { duration: 0.8 })

    timeline.addLabel('leitura')

    // Se faltar altura, retira o anel antes de subir o texto
    timeline.to('.anel-3d', {
      opacity: () => excessoDescricao() > 0 ? 0 : 1,
      duration: 0.25
    }, 'leitura')

    // Move título e descrição juntos, sem criar rolagem interna
    timeline.fromTo(
      ['.titulo-direita', '.descricao-tropa'],
      { y: 0 },
      {
        y: () => -excessoDescricao(),
        duration: 0.9,
        immediateRender: false
      },
      'leitura+=0.25'
    )

    timeline.to({}, { duration: 0.5 })

    timeline.addLabel('escolha')

    timeline.to('.anel-3d', {
      opacity: 1,
      duration: 0.5
    }, 'escolha+=0.5')


    timeline.to('.titulo-tropa', {
      autoAlpha: 0,
      duration: 0.5
    }, 'escolha')

    // Esconde o conteudo anterior
    timeline.to(
      ['.titulo-direita', '.descricao-tropa'],
      {
        autoAlpha: 0, 
        duration: 0.5
      },
      'escolha'
    )

    //Traz o anel de volta para o centro
    timeline.to(grupoAnel.position, {
      x: 0, 
      duration: 1
    }, 'escolha')

    //Tamnho do anel nessa etapa
    timeline.to(grupoAnel.scale, {
      x: () => tamanhoAnel(2) / maiorDimensao, 
      y: () => tamanhoAnel(2) / maiorDimensao,
      z: () => tamanhoAnel(2) / maiorDimensao,
      duration: 1
    }, 'escolha')

    timeline.to(movimentoAnel, {
      y: 0,
      duration: 1
    }, 'escolha')

    //Revela o titulo
    timeline.fromTo(
      '.titulo-escolha',
      { y: 25, autoAlpha: 0},
      {y: 0, autoAlpha: 1, duration: 0.6},
      'escolha+=0.4'
    )

    //Revela as opçoes
    timeline.fromTo(
      '.opcoes-tropas',
      {y: 20, autoAlpha: 0},
      {y:0, autoAlpha: 1, duration: 0.6},
      'escolha+=0.7'
    )

    //Mantem a selecao em tela por mais um trecho do scroll
    timeline.to({}, {duration: 0.6})


    ScrollTrigger.refresh()

    const videoUniverso = document.querySelector('.universo')
    const simbolo = document.querySelector('.simbolo')
    const nomeTropa = document.querySelector('.texto-verde')
    const descricao = document.querySelector('.descricao-tropa')
    const botoesTropas = document.querySelectorAll('.opcoes-tropas button[data-tropa]')

    //Guarda os dados atuais para permitir voltar ao verde
    const tropas = {
      verde: {
        modelo,
        video: videoUniverso.currentSrc || videoUniverso.querySelector('source').src,
        simbolo: simbolo.getAttribute('src'),
        nome: 'VERDES',
        cor: '#139d0c',
        descricao: descricao.textContent.trim()
      },
      vermelha: {
        modelo: null,
        arquivo: '/arquivos3D/anel_vermelho.glb',
        video: '/videos/nebulosa-vermelha.mp4',
        simbolo: '/img/red-lantern-symbol-fig.png',
        nome: 'VERMELHOS',
        cor: '#ed1717',
        descricao:
        'Movidos pela raiva, os Lanternas Vermelhos usam anéis ' +
        'alimentados pela luz vermelha do espectro emocional. ' +
        'Liderados por Atrocitus, transformam a dor e as perdas ' +
        'que sofreram em poder e em uma busca por vingança.'
      },

      amarela: {
        modelo: null,
        arquivo: '/arquivos3D/anel_amarelo.glb',
        video: '/videos/nebulosa-amarela.mp4',
        simbolo: '/img/yellow-lantern-symbol-fig.png',
        nome: 'AMARELOS',
        cor: '#ffdc00',
        descricao: 
          'A Tropa Sinestro utiliza a luz amarela do espectro emocional, ' +
          'alimentada pelo medo. Seus integrantes são escolhidos pela ' +
          'capacidade de provocar terror. Liderados por Sinestro, ' +
          'enfrentam os Lanternas Verdes e buscam impor sua visão ' +
          'de ordem ao universo.'
      }
    }

    let tropaAtual = 'verde'
    let trocando = false
    async function trocarTropa(destino) {
      if(trocando || destino === tropaAtual) return

      trocando = true
      botoesTropas.forEach((botao) => {
        botao.disabled = true
        botao.setAttribute('aria-busy', 'true')
      })

      const dados = tropas[destino]

      try {
        //Carregar somente na primeira escolha dessa tropa
        if(!dados.modelo){
          const arquivo = await loader.loadAsync(dados.arquivo)
          const novoModelo = arquivo.scene

          const caixaNova = new THREE.Box3().setFromObject(novoModelo)
          const tamanhoNovo = caixaNova.getSize(new THREE.Vector3())
          const centroNovo = caixaNova.getCenter(new THREE.Vector3())

          const maiorDimensaoNova = Math.max(
            tamanhoNovo.x,
            tamanhoNovo.y,
            tamanhoNovo.z
          )

          if(maiorDimensaoNova <= 0){
            throw new Error('O modelo carregado não possui tamanho válido.')
          }

          novoModelo.position.sub(centroNovo)

          //Iguala o tamanho de referencia ao do modelo verde
          //Assim, as escalas da timeline continuam funcionando
          const suporte = new THREE.Group()
          suporte.add(novoModelo)
          suporte.scale.setScalar(maiorDimensao / maiorDimensaoNova)

          dados.modelo = suporte
        }
        
        //Confere imagem antes de substituit a apresentação
        const imagem = new Image()
        imagem.src = dados.simbolo
        await imagem.decode()

        //Troca o anel, mantendo o grupo animado pela a timeline
        grupoAnel.remove(tropas[tropaAtual].modelo)
        grupoAnel.add(dados.modelo)

        //Troca os textos e a cor 
        nomeTropa.textContent = dados.nome
        nomeTropa.style.color = dados.cor
        descricao.textContent = dados.descricao

        //Troca o símbolo
        simbolo.src = dados.simbolo
        simbolo.alt = `Simbolo dos Lanternas ${dados.nome.toLowerCase()}`

        //Troca de video
        videoUniverso.src = dados.video
        videoUniverso.load()
        videoUniverso.play().catch((erro) => {
          console.warn('Não foi possivel iniciar o video:', erro)
        })

        tropaAtual = destino

        //O mesmo botão perimite escolher a outra tropa 
        botoesTropas.forEach((botao) => {
          botao.setAttribute('aria-pressed', String(botao.dataset.tropa === tropaAtual))
        })

        //Retorna ao começo da apresentação
        const controleScroll = timeline.scrollTrigger

        window.scrollTo({
          top: controleScroll.start,
          behavior: 'instant'
        })

        ScrollTrigger.update()

        // Evita que o scrub fique alcançando a posição anterior
        controleScroll.getTween()?.progress(1)
        timeline.progress(0)
        ScrollTrigger.refresh()

      } catch(erro){
        console.log('Erro ao trocar de tropa:', erro)
        alert('Não foi possível carregar a tropa. Confira os arquivos e os caminhos.')
      } finally {
        trocando = false
        botoesTropas.forEach((botao) => {
          botao.disabled = false
          botao.removeAttribute('aria-busy')
        })
      }
    }
    
    botoesTropas.forEach((botao) => {
      botao.addEventListener('click', () => {
        trocarTropa((botao.dataset.tropa))
      })
    })
  },
  
  undefined,

  (erro) => {
    console.log('Não foi possível carregar o anel: ', erro)
  }
)

//Desenha a cena continuamente
renderer.setAnimationLoop((tempo) => {
  const segundos = tempo / 1000

  //Flutuação suave
  grupoAnel.position.y = movimentoAnel.y + Math.sin(segundos * 1.2) * 0.08

  //Inclinação suave nos eixos X e Y
  grupoAnel.rotation.x = THREE.MathUtils.degToRad(55) + Math.sin(segundos * 0.7) * 0.1
  grupoAnel.rotation.y = THREE.MathUtils.degToRad(-20) + Math.sin(segundos * 0.05) * 0.2

  renderer.render(scene, camera)
})

//Ajusta a camera e o desenho ao redimensionar a janela
window.addEventListener('resize', () => {
  const largura = container.clientWidth
  const altura = container.clientHeight

  camera.aspect = largura / altura
  camera.updateProjectionMatrix()

  renderer.setSize(largura, altura)
})