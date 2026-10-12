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
    const escalaFinal = 1.4 / maiorDimensao

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
        x: -60,
        opacity: 0
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.6
      },
      '>'
    )

    timeline.fromTo(
      '.titulo-direita',
      {
        x: 60,
        opacity: 0
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.6
      },
      '<'
    )

    //pequeno intervalo de scroll para o titulo ter mais tempo de tela
    timeline.addLabel('descricao', '+=0.3')

    //Titulo centralizadoa a direita no inicio; alinhado a esquerda na descrição
    timeline.set('.titulo-direita', {
      textAlign: 'left'
    }, 'descricao')

    //Retira "TROPA DOS"
    timeline.to('.titulo-esquerda', {
      opacity: 0,
      x: -40,
      duration: 0.3
    }, 'descricao')

    //O anel sai do centro e vai para a parte esquerda do site
    timeline.to(grupoAnel.position, {
      x: () => {
        const alturaVisivel = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))

        const larguraVisivel =alturaVisivel * camera.aspect

        return -larguraVisivel * 0.25
      }, 
      duration: 1
    }, 'descricao')

    timeline.to(grupoAnel.scale, {
      x: 1.8 / maiorDimensao,
      y: 1.8 / maiorDimensao,
      z: 1.8 / maiorDimensao,
      duration: 1
    }, 'descricao')

    // Leva o titulo para cima da descrição
    // Usa a mesma largura e margem direita do paragrafo
    timeline.to('.titulo-direita', {
      top: '32%',
      right: '8%',
      width: '30%',
      x: 0,
      duration: 1
    }, 'descricao')

    //Revela a descrição com um pequeno movimento para cima
    timeline.fromTo('.descricao-tropa', {
      y: 20,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      duration: 0.7
    }, 'descricao+=0.3')


    // tempo para ler a descrição
    timeline.to({}, {duration: 0.8})

    timeline.addLabel('escolha')


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
      x: 2 / maiorDimensao, 
      y: 2 / maiorDimensao,
      z: 2 / maiorDimensao,
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
    const descricao = document.querySelector('descicao-tropa')
    const botaoTroca = document.querySelector('.opcao-vermelha')

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
        arquivo: './arquivos3D/anel-vermelho.glb',
        video: './videos/nebulosa-vermelha.mp4',
        nome: 'VERMELHOS',
        cor: '#ed1717',
        descricao:
        'Movidos pela raiva, os Lanternas Vermelhos usam anéis ' +
        'alimentados pela luz vermelha do espectro emocional. ' +
        'Liderados por Atrocitus, transformam a dor e as perdas ' +
        'que sofreram em poder e em uma busca por vingança.'
      }
    }

    let tropaAtual = 'verde'
    let trocando = false
    async function trocarTropa(destino) {
      if(trocando || destino === tropaAtual) return

      trocando = true
      botaoTroca.disabled = true
      botaoTroca.setAttribute('arial-busy', 'true')

      const dados = tropas[destino]

      
    }
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
  grupoAnel.position.y = Math.sin(segundos * 1.2) * 0.08

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