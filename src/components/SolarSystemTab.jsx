import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const PLANET_DATA = {
  Sun: { radius: 12, distance: 0, speed: 0, rotSpeed: 0.001, color: 0xffaa00, texture: "/2k_sun.jpg" },
  Mercury: { radius: 1.2, distance: 22, speed: 0.041, rotSpeed: 0.005, color: 0xa6a6a6, texture: "/2k_mercury.jpg" },
  Venus: { radius: 2.0, distance: 32, speed: 0.016, rotSpeed: -0.002, color: 0xe3bb76, texture: "/2k_venus_atmosphere.jpg" },
  Earth: { 
    radius: 2.2, distance: 45, speed: 0.010, rotSpeed: 0.04, color: 0x2233ff, 
    texture: "/2k_earth_daymap.jpg",
    moons: [{ name: "Moon", distance: 4.5, size: 0.6, speed: 0.13, color: 0xcccccc, texture: "/2k_moon.jpg" }]
  },
  Mars: { 
    radius: 1.6, distance: 58, speed: 0.0053, rotSpeed: 0.038, color: 0xc1440e,
    texture: "/2k_mars.jpg",
    moons: [
      { name: "Phobos", distance: 2.8, size: 0.3, speed: 0.2, color: 0x888888 },
      { name: "Deimos", distance: 3.8, size: 0.25, speed: 0.15, color: 0x777777 }
    ]
  },
  Jupiter: { 
    radius: 5.5, distance: 80, speed: 0.00084, rotSpeed: 0.02, color: 0xb07f35,
    texture: "/2k_jupiter.jpg",
    moons: [
      { name: "Io", distance: 8, size: 0.5, speed: 0.1, color: 0xffffaa },
      { name: "Europa", distance: 10, size: 0.45, speed: 0.08, color: 0xffffff },
      { name: "Ganymede", distance: 12, size: 0.7, speed: 0.06, color: 0xaaaaaa },
      { name: "Callisto", distance: 14, size: 0.65, speed: 0.04, color: 0x888888 }
    ]
  },
  Saturn: { 
    radius: 4.5, distance: 105, speed: 0.00034, rotSpeed: 0.02, color: 0xe2bf7d, 
    hasRings: true, 
    texture: "/2k_saturn.jpg",
    ringTexture: "/2k_saturn_ring_alpha.png",
    moons: [{ name: "Titan", distance: 11, size: 0.8, speed: 0.05, color: 0xffcc88 }]
  },
  Uranus: { 
    radius: 3.2, distance: 130, speed: 0.00012, rotSpeed: -0.01, color: 0x4b70dd, texture: "/2k_uranus.jpg",
    moons: [{ name: "Titania", distance: 6, size: 0.5, speed: 0.07, color: 0xdddddd }]
  },
  Neptune: { 
    radius: 3.0, distance: 155, speed: 0.00006, rotSpeed: 0.01, color: 0x274687, texture: "/2k_neptune.jpg",
    moons: [{ name: "Triton", distance: 6, size: 0.6, speed: 0.06, color: 0xffffff }]
  }
};

export default function SolarSystemTab() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);
    scene.fog = new THREE.FogExp2(0x000005, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 100, 200);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 20;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15); // Increased for base visibility
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 500, 3000, 1.2); // Set intensity to 500
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    // Optimize shadow camera for large scale
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000;
    scene.add(sunLight);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();

    // Celestial Bodies
    const planets = {};
    const orbitLines = [];

    Object.keys(PLANET_DATA).forEach((key) => {
      const data = PLANET_DATA[key];
      const planetContainer = new THREE.Group();
      scene.add(planetContainer);

      let planetMesh;
      const geo = new THREE.SphereGeometry(data.radius, 32, 32);
      const matParams = {};
      if (data.texture) {
        matParams.map = textureLoader.load(data.texture);
      } else {
        matParams.color = data.color;
      }

      if (key === "Sun") {
        const mat = new THREE.MeshBasicMaterial(matParams);
        planetMesh = new THREE.Mesh(geo, mat);

        // Reverted Sun Glow (Single layer)
        const glowGeo = new THREE.SphereGeometry(data.radius * 1.15, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xffcc00,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide
        });
        planetMesh.add(new THREE.Mesh(glowGeo, glowMat));
      } else {
        const mat = new THREE.MeshPhongMaterial({
          ...matParams,
          shininess: 5
        });
        planetMesh = new THREE.Mesh(geo, mat);
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;

        const points = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(theta) * data.distance, 0, Math.sin(theta) * data.distance));
        }
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        scene.add(orbitLine);
      }

      planetContainer.add(planetMesh);
      planetContainer.position.x = data.distance;

      if (data.hasRings) {
        const innerRadius = data.radius * 1.4;
        const outerRadius = data.radius * 2.2;
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const distance = Math.sqrt(vx * vx + vy * vy);
          const norm = (distance - innerRadius) / (outerRadius - innerRadius);
          uv.setXY(i, norm, 0.5);
        }

        const ringMatParams = {
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          shininess: 5
        };
        if (data.ringTexture) {
          ringMatParams.map = textureLoader.load(data.ringTexture);
        } else {
          ringMatParams.color = 0xc5ab6e;
        }
        const ringMat = new THREE.MeshPhongMaterial(ringMatParams);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;
        planetContainer.add(ringMesh);
      }

      const planetMoons = [];
      if (data.moons) {
        data.moons.forEach(moonData => {
          const moonGeo = new THREE.SphereGeometry(moonData.size, 16, 16);
          const moonMatParams = {};
          if (moonData.texture) {
            moonMatParams.map = textureLoader.load(moonData.texture);
          } else {
            moonMatParams.color = moonData.color;
          }
          const moonMat = new THREE.MeshPhongMaterial({
            ...moonMatParams,
            shininess: 0
          });
          const moonMesh = new THREE.Mesh(moonGeo, moonMat);
          moonMesh.castShadow = true;
          moonMesh.receiveShadow = true;
          planetContainer.add(moonMesh);
          planetMoons.push({
            mesh: moonMesh,
            distance: moonData.distance,
            speed: moonData.speed,
            angle: Math.random() * Math.PI * 2
          });
        });
      }

      planets[key] = {
        container: planetContainer,
        mesh: planetMesh,
        speed: data.speed,
        rotSpeed: data.rotSpeed,
        angle: Math.random() * Math.PI * 2,
        moons: planetMoons
      };
    });

    // Starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 5000;
    const posArray = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1500;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const starsMaterial = new THREE.PointsMaterial({ size: 0.7, color: 0xffffff });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // Animation
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      Object.keys(planets).forEach((key) => {
        const p = planets[key];
        p.mesh.rotation.y += p.rotSpeed;

        if (key !== "Sun") {
          p.angle += p.speed * 0.5;
          p.container.position.x = Math.cos(p.angle) * PLANET_DATA[key].distance;
          p.container.position.z = Math.sin(p.angle) * PLANET_DATA[key].distance;
        }

        p.moons.forEach(moon => {
          moon.angle += moon.speed * 0.5;
          moon.mesh.position.x = Math.cos(moon.angle) * moon.distance;
          moon.mesh.position.z = Math.sin(moon.angle) * moon.distance;
        });
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-black overflow-hidden relative" />
  );
}
