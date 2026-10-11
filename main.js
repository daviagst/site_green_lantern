import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { time } from 'three/tsl'

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
  '/arquivos3D/green_lantern_ring.glb',

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
    grupoAnel.scale.setScalar(0.2 / maiorDimensao)

    grupoAnel.rotation.set(
      THREE.MathUtils.degToRad(55),
      THREE.MathUtils.degToRad(-20),
      THREE.MathUtils.degToRad(-10)
    )

    const escalaInicial = 0.5 / maiorDimensao
    const escalaFinal = 1.4 / maiorDimensao

    grupoAnel.scale.setScalar(escalaInicial)

    const timeline = gsap.timeline({
      defaults: {
        ease: 'none'
      },

      scrollTrigger: {
        trigger: '.abertura',
        start: 'top top',
        end: () => `+=${window.innerHeight *2}`,
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


    ScrollTrigger.refresh()
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