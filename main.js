import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const container = document.querySelector('.anel-3d')

// Cena: onde ficam o modelo e as luzes.
const scene = new THREE.Scene()

// Câmera: determina de onde enxergamos o anel.
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
)

camera.position.z = 5

// Fundo transparente para manter o vídeo visível.
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
})

renderer.setSize(container.clientWidth, container.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

// Luz geral e uma luz mais forte vindo da frente.
const luzAmbiente = new THREE.HemisphereLight(
  0xffffff,
  0x203020,
  2
)

scene.add(luzAmbiente)

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 4)
luzPrincipal.position.set(3, 4, 5)
scene.add(luzPrincipal)

// Grupo que usaremos para movimentar o anel.
const grupoAnel = new THREE.Group()
scene.add(grupoAnel)

const loader = new GLTFLoader()

loader.load(
  '/arquivos3D/green_lantern_ring.glb',

  (gltf) => {
    const modelo = gltf.scene

    // Descobre as dimensões originais do modelo.
    const caixa = new THREE.Box3().setFromObject(modelo)
    const tamanho = caixa.getSize(new THREE.Vector3())
    const centro = caixa.getCenter(new THREE.Vector3())

    // Coloca o centro do modelo na origem.
    modelo.position.sub(centro)

    // Ajusta o tamanho sem depender da escala do arquivo.
    const maiorDimensao = Math.max(
      tamanho.x,
      tamanho.y,
      tamanho.z
    )

    grupoAnel.add(modelo)
    grupoAnel.scale.setScalar(2 / maiorDimensao)
    grupoAnel.rotation.set(
        THREE.MathUtils.degToRad(55),
        THREE.MathUtils.degToRad(-20),
        THREE.MathUtils.degToRad(-10)
    )
  },

  undefined,

  (erro) => {
    console.error('Não foi possível carregar o anel:', erro)
  }
)

// Desenha a cena continuamente.
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera)
})

// Ajusta a câmera e o desenho ao redimensionar a janela.
window.addEventListener('resize', () => {
  const largura = container.clientWidth
  const altura = container.clientHeight

  camera.aspect = largura / altura
  camera.updateProjectionMatrix()

  renderer.setSize(largura, altura)
})