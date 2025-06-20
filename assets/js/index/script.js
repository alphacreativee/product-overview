import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "https://cdn.skypack.dev/dat.gui";

document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  const header1Split = new SplitText(".header-1 h1", {
    type: "chars",
    charsClass: "char",
  });
  const titleSplits = new SplitText(".tooltip .title h2", {
    type: "lines",
    linesClass: "line",
  });
  const descriptionSplits = new SplitText(".tooltip .description p", {
    type: "lines",
    linesClass: "line",
  });

  header1Split.chars.forEach(
    (char) => (char.innerHTML = `<span>${char.innerHTML}</span>`)
  );

  [...titleSplits.lines, ...descriptionSplits.lines].forEach(
    (line) => (line.innerHTML = `<span>${line.innerHTML}</span>`)
  );

  const animOptions = {
    duration: 1,
    ease: "power3.out",
    stagger: 0.025,
  };

  const tooltipSelectors = [
    {
      trigger: 0.65,
      elements: [
        ".tooltip:nth-child(1) .icon h3",
        ".tooltip:nth-child(1) .title .line > span",
        ".tooltip:nth-child(1) .description .line > span",
      ],
    },
    {
      trigger: 0.85,
      elements: [
        ".tooltip:nth-child(2) .icon h3",
        ".tooltip:nth-child(2) .title .line > span",
        ".tooltip:nth-child(2) .description .line > span",
      ],
    },
  ];

  ScrollTrigger.create({
    trigger: ".product-overview",
    start: "75% bottom",
    // markers: true,
    onEnter: () => {
      gsap.to(".header-1 h1 .char > span", {
        y: "0%",
        duration: 1,
        ease: "power3.out",
        stagger: 0.025,
      });
    },
    onLeaveBack: () => {
      gsap.to(".header-1 h1 .char > span", {
        y: "100%",
        duration: 1,
        ease: "power3.out",
        stagger: 0.025,
      });
    },
  });

  // 3D Setup
  let modal,
    currentRotation = 0,
    modalSize;
  let useGUIPosition = false; // Cờ để kiểm soát vị trí từ GUI
  let useGUIRotation = false; // Cờ để kiểm soát xoay từ GUI

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  document.querySelector(".modal-container").appendChild(renderer.domElement);

  // Lighting Setup
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(2, 2, 3);
  mainLight.castShadow = true;
  mainLight.shadow.bias = -0.001;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-2, 0, -2);
  scene.add(fillLight);

  // dat.GUI Setup
  const gui = new dat.GUI();
  const lightParams = {
    ambientIntensity: 0.7,
    mainLightIntensity: 1,
    mainLightColor: "#ffffff",
    mainLightPosX: 2,
    mainLightPosY: 2,
    mainLightPosZ: 3,
    fillLightIntensity: 0.5,
    fillLightColor: "#ffffff",
    fillLightPosX: -2,
    fillLightPosY: 0,
    fillLightPosZ: -2,
    modalPosX: 0,
    modalPosY: 0,
    modalPosZ: 0,
    modalRotX: 0,
    modalRotY: 0,
    modalRotZ: 0,
    resetRotation: () => {
      if (modal) {
        const isMobile = window.innerWidth < 1024;
        modal.rotation.set(
          THREE.MathUtils.degToRad(-25),
          THREE.MathUtils.degToRad(-40),
          isMobile ? 0 : THREE.MathUtils.degToRad(-25)
        );
        lightParams.modalRotX = modal.rotation.x;
        lightParams.modalRotY = modal.rotation.y;
        lightParams.modalRotZ = modal.rotation.z;
        gui.__folders["Modal Rotation (Xoay mô hình)"].__controllers.forEach(
          (controller) => {
            controller.updateDisplay();
          }
        );
        useGUIRotation = false;
        console.log("Rotation reset to initial values");
      }
    },
  };

  // Ambient Light Controls
  const ambientFolder = gui.addFolder("Ambient Light (ánh sáng môi trường)");
  ambientFolder
    .add(lightParams, "ambientIntensity", 0, 2, 0.1)
    .name("Intensity")
    .onChange((value) => {
      scene.children.find(
        (child) => child instanceof THREE.AmbientLight
      ).intensity = value;
    });

  // Main Directional Light Controls
  const mainLightFolder = gui.addFolder("Main Directional Light (hướng chính)");
  mainLightFolder
    .add(lightParams, "mainLightIntensity", 0, 2, 0.1)
    .name("Intensity")
    .onChange((value) => {
      mainLight.intensity = value;
    });
  mainLightFolder
    .addColor(lightParams, "mainLightColor")
    .name("Color")
    .onChange((value) => {
      mainLight.color.set(value);
    });
  mainLightFolder
    .add(lightParams, "mainLightPosX", -20, 20, 0.1)
    .name("Position X")
    .onChange((value) => {
      mainLight.position.x = value;
    });
  mainLightFolder
    .add(lightParams, "mainLightPosY", -10, 10, 0.1)
    .name("Position Y")
    .onChange((value) => {
      mainLight.position.y = value;
    });
  mainLightFolder
    .add(lightParams, "mainLightPosZ", -10, 10, 0.1)
    .name("Position Z")
    .onChange((value) => {
      mainLight.position.z = value;
    });

  // Fill Directional Light Controls
  const fillLightFolder = gui.addFolder("Fill Directional Light (hướng phụ)");
  fillLightFolder
    .add(lightParams, "fillLightIntensity", 0, 2, 0.1)
    .name("Intensity")
    .onChange((value) => {
      fillLight.intensity = value;
    });
  fillLightFolder
    .addColor(lightParams, "fillLightColor")
    .name("Color")
    .onChange((value) => {
      fillLight.color.set(value);
    });
  fillLightFolder
    .add(lightParams, "fillLightPosX", -10, 10, 0.1)
    .name("Position X")
    .onChange((value) => {
      fillLight.position.x = value;
    });
  fillLightFolder
    .add(lightParams, "fillLightPosY", -10, 10, 0.1)
    .name("Position Y")
    .onChange((value) => {
      fillLight.position.y = value;
    });
  fillLightFolder
    .add(lightParams, "fillLightPosZ", -10, 10, 0.1)
    .name("Position Z")
    .onChange((value) => {
      fillLight.position.z = value;
    });

  // Modal Position Controls
  const modalFolder = gui.addFolder("Modal Position (Vị trí mô hình)");
  modalFolder
    .add(lightParams, "modalPosX", -10, 10, 0.1)
    .name("Position X")
    .onChange((value) => {
      if (modal) {
        modal.position.x = value;
        useGUIPosition = true;
      }
    });
  modalFolder
    .add(lightParams, "modalPosY", -10, 10, 0.1)
    .name("Position Y")
    .onChange((value) => {
      if (modal) {
        modal.position.y = value;
        useGUIPosition = true;
      }
    });
  modalFolder
    .add(lightParams, "modalPosZ", -10, 10, 0.1)
    .name("Position Z")
    .onChange((value) => {
      if (modal) {
        modal.position.z = value;
        useGUIPosition = true;
      }
    });

  // Modal Rotation Controls
  const modalRotationFolder = gui.addFolder("Modal Rotation (Xoay mô hình)");
  modalRotationFolder
    .add(lightParams, "modalRotX", -Math.PI * 2, Math.PI * 2, 0.01)
    .name("Rotation X")
    .onChange((value) => {
      if (modal) {
        modal.rotation.x = value;
        useGUIRotation = true;
        logRotationPosition();
      }
    });
  modalRotationFolder
    .add(lightParams, "modalRotY", -Math.PI * 2, Math.PI * 2, 0.01)
    .name("Rotation Y")
    .onChange((value) => {
      if (modal) {
        modal.rotation.y = value;
        useGUIRotation = true;
        currentRotation = value; // Đồng bộ với ScrollTrigger
        logRotationPosition();
      }
    });
  modalRotationFolder
    .add(lightParams, "modalRotZ", -Math.PI * 2, Math.PI * 2, 0.01)
    .name("Rotation Z")
    .onChange((value) => {
      if (modal) {
        modal.rotation.z = value;
        useGUIRotation = true;
        logRotationPosition();
      }
    });
  modalRotationFolder.add(lightParams, "resetRotation").name("Reset Rotation");

  // Function to log rotation and position for debugging
  function logRotationPosition() {
    if (modal) {
      const box = new THREE.Box3().setFromObject(modal);
      const center = box.getCenter(new THREE.Vector3());
      console.log("Rotation (radians):", modal.rotation);
      console.log("Center Position:", center);
      console.log("Camera Position:", camera.position);
    }
  }

  let isMobile; // Biến toàn cục để lưu trạng thái mobile/desktop

  function setupModal() {
    if (!modal || !modalSize || (useGUIPosition && useGUIRotation)) return;

    isMobile = window.innerWidth < 1024;
    const box = new THREE.Box3().setFromObject(modal);
    const center = box.getCenter(new THREE.Vector3());

    if (!useGUIPosition) {
      modal.position.set(
        isMobile ? center.x + modalSize.x * 1 : -center.x - modalSize.x * 0.4,
        -center.y + modalSize.y * 0.085,
        -center.z
      );
    }

    if (!useGUIRotation) {
      modal.rotation.set(
        THREE.MathUtils.degToRad(-25),
        THREE.MathUtils.degToRad(-40),
        isMobile ? 0 : THREE.MathUtils.degToRad(-25)
      );
      currentRotation = 0; // Reset currentRotation khi setupModal chạy
    }

    const cameraDistance = isMobile ? 2 : 1.25;
    camera.position.set(
      0,
      0,
      Math.max(modalSize.x, modalSize.y, modalSize.z) * cameraDistance
    );
    camera.lookAt(0, 0, 0);

    // Cập nhật giá trị GUI sau khi setupModal
    lightParams.modalPosX = modal.position.x;
    lightParams.modalPosY = modal.position.y;
    lightParams.modalPosZ = modal.position.z;
    lightParams.modalRotX = modal.rotation.x;
    lightParams.modalRotY = modal.rotation.y;
    lightParams.modalRotZ = modal.rotation.z;
    if (gui.__folders["Modal Position (Vị trí mô hình)"]) {
      gui.__folders["Modal Position (Vị trí mô hình)"].__controllers.forEach(
        (controller) => {
          controller.updateDisplay();
        }
      );
    }
    if (gui.__folders["Modal Rotation (Xoay mô hình)"]) {
      gui.__folders["Modal Rotation (Xoay mô hình)"].__controllers.forEach(
        (controller) => {
          controller.updateDisplay();
        }
      );
    }
  }

  new GLTFLoader().load("./assets/images/modal.glb", (gltf) => {
    modal = gltf.scene;
    modal.traverse((node) => {
      if (node.isMesh && node.material) {
        Object.assign(node.material, {
          metalness: 0.05,
          roughness: 0.9,
        });
      }
    });
    const box = new THREE.Box3().setFromObject(modal);
    const size = box.getSize(new THREE.Vector3());

    modalSize = size;
    scene.add(modal);
    setupModal();
  });

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    setupModal();
  });

  ScrollTrigger.create({
    trigger: ".product-overview",
    start: "top top",
    end: `+=${window.innerHeight * 10}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    // markers: true,
    onUpdate: ({ progress }) => {
      const headerProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.3));
      gsap.to(".header-1 ", {
        xPercent:
          progress < 0.05 ? 0 : progress > 0.35 ? -100 : -100 * headerProgress,
      });

      const maskSize =
        progress < 0.2
          ? 0
          : progress > 0.3
          ? 100
          : 100 * ((progress - 0.2) / 0.1);

      gsap.to(".circular-mask", {
        clipPath: `circle(${maskSize}%  at 50% 50%)`,
      });

      const header2Progress = (progress - 0.15) / 0.35;
      const header2XPercent =
        progress < 0.15
          ? 100
          : progress > 0.5
          ? -200
          : 100 - 300 * header2Progress;

      gsap.to(".header-2", { xPercent: header2XPercent });
      const scaleX =
        progress < 0.45
          ? 0
          : progress > 0.65
          ? 100
          : 100 * ((progress - 0.45) / 0.2);

      gsap.to(".tooltips .divider", {
        scaleX: `${scaleX}%`,
        ...animOptions,
      });

      tooltipSelectors.forEach(({ trigger, elements }) => {
        gsap.to(elements, {
          y: progress >= trigger ? "0%" : "125%",
          ...animOptions,
        });
      });

      if (modal && progress > 0.05 && !useGUIRotation) {
        const rotationProgress = (progress - 0.05) / 0.95;
        const targetRotation = Math.PI * 3 * 4 * rotationProgress;
        const rotationDiff = targetRotation - currentRotation;
        if (Math.abs(rotationDiff) > 0.001) {
          modal.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationDiff);
          currentRotation = targetRotation;
          lightParams.modalRotY = modal.rotation.y; // Cập nhật GUI khi ScrollTrigger xoay
          gui.__folders[
            "Modal Rotation (Xoay mô hình)"
          ].__controllers[1].updateDisplay();
          logRotationPosition();
        }
      }
    },
  });
});
