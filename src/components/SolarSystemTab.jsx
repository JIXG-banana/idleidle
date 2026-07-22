import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import sunTexture from "../assets/2k_sun.jpg";
import mercuryTexture from "../assets/2k_mercury.jpg";
import venusTexture from "../assets/2k_venus_atmosphere.jpg";
import earthTexture from "../assets/2k_earth_daymap.jpg";
import moonTexture from "../assets/2k_moon.jpg";
import marsTexture from "../assets/2k_mars.jpg";
import jupiterTexture from "../assets/2k_jupiter.jpg";
import saturnTexture from "../assets/2k_saturn.jpg";
import saturnRingTexture from "../assets/2k_saturn_ring_alpha.png";
import uranusTexture from "../assets/2k_uranus.jpg";
import neptuneTexture from "../assets/2k_neptune.jpg";

const PLANET_DATA = {
  Sun: { radius: 12, distance: 0, speed: 0, rotSpeed: 0.001, color: 0xffaa00, texture: sunTexture },
  Mercury: { radius: 1.2, distance: 22, speed: 0.041, rotSpeed: 0.005, color: 0xa6a6a6, texture: mercuryTexture },
  Venus: { radius: 2.0, distance: 32, speed: 0.016, rotSpeed: -0.002, color: 0xe3bb76, texture: venusTexture },
  Earth: { 
    radius: 2.2, distance: 45, speed: 0.010, rotSpeed: 0.04, color: 0x2233ff, 
    texture: earthTexture,
    moons: [{ name: "Moon", distance: 4.5, size: 0.6, speed: 0.13, color: 0xcccccc, texture: moonTexture }]
  },
  Mars: { 
    radius: 1.6, distance: 58, speed: 0.0053, rotSpeed: 0.038, color: 0xc1440e,
    texture: marsTexture,
    moons: [
      { name: "Phobos", distance: 2.8, size: 0.3, speed: 0.2, color: 0x888888 },
      { name: "Deimos", distance: 3.8, size: 0.25, speed: 0.15, color: 0x777777 }
    ]
  },
  Jupiter: { 
    radius: 5.5, distance: 80, speed: 0.00084, rotSpeed: 0.02, color: 0xb07f35,
    texture: jupiterTexture,
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
    texture: saturnTexture,
    ringTexture: saturnRingTexture,
    moons: [{ name: "Titan", distance: 11, size: 0.8, speed: 0.05, color: 0xffcc88 }]
  },
  Uranus: { 
    radius: 3.2, distance: 130, speed: 0.00012, rotSpeed: -0.01, color: 0x4b70dd, texture: uranusTexture,
    moons: [{ name: "Titania", distance: 6, size: 0.5, speed: 0.07, color: 0xdddddd }]
  },
  Neptune: { 
    radius: 3.0, distance: 155, speed: 0.00006, rotSpeed: 0.01, color: 0x274687, texture: neptuneTexture,
    moons: [{ name: "Triton", distance: 6, size: 0.6, speed: 0.06, color: 0xffffff }]
  }
};

export default function SolarSystemTab() {
  const containerRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLowDetail, setIsLowDetail] = useState(false);
  const [trackedPlanet, setTrackedPlanet] = useState(null);
  const trackedPlanetRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const textures = {};

    // Timeout for slow network (e.g., 3 seconds)
    const timeoutId = setTimeout(() => {
      if (isLoading && isMounted) {
        console.warn("Network slow, switching to simplified models.");
        setIsLowDetail(true);
        setIsLoading(false);
      }
    }, 3500);

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (isMounted) {
        setLoadingProgress((itemsLoaded / itemsTotal) * 100);
      }
    };

    loadingManager.onLoad = () => {
      clearTimeout(timeoutId);
      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadingManager.onError = (url) => {
      console.error("Error loading texture:", url);
    };

    // Preload textures
    const textureUrls = [];
    Object.values(PLANET_DATA).forEach(data => {
      if (data.texture) textureUrls.push(data.texture);
      if (data.ringTexture) textureUrls.push(data.ringTexture);
      if (data.moons) {
        data.moons.forEach(m => {
          if (m.texture) textureUrls.push(m.texture);
        });
      }
    });

    textureUrls.forEach(url => {
      textures[url] = textureLoader.load(url);
    });

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
    const renderer = new THREE.WebGLRenderer({ antialias: !isLowDetail });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = !isLowDetail;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 20;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLowDetail ? 0.5 : 0.15);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 500, 3000, 1.2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = !isLowDetail;
    if (!isLowDetail) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
    }
    scene.add(sunLight);

    // Celestial Bodies
    const planets = {};
    const segments = isLowDetail ? 16 : 32;

    Object.keys(PLANET_DATA).forEach((key) => {
      const data = PLANET_DATA[key];
      const planetContainer = new THREE.Group();
      scene.add(planetContainer);

      let planetMesh;
      const geo = new THREE.SphereGeometry(data.radius, segments, segments);
      
      let mat;
      if (!isLowDetail && data.texture && textures[data.texture]) {
        const matParams = { map: textures[data.texture] };
        if (key === "Sun") {
          mat = new THREE.MeshBasicMaterial(matParams);
        } else {
          mat = new THREE.MeshPhongMaterial({ ...matParams, shininess: 5 });
        }
      } else {
        const matParams = { color: data.color };
        if (key === "Sun") {
          mat = new THREE.MeshBasicMaterial(matParams);
        } else {
          mat = new THREE.MeshLambertMaterial(matParams);
        }
      }

      planetMesh = new THREE.Mesh(geo, mat);
      if (!isLowDetail && key !== "Sun") {
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;
      }

      if (key === "Sun") {
        // Sun Glow
        const glowGeo = new THREE.SphereGeometry(data.radius * 1.15, segments, segments);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xffcc00,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide
        });
        planetMesh.add(new THREE.Mesh(glowGeo, glowMat));
      } else {
        // Orbit line
        const orbitPoints = 64;
        const points = [];
        for (let i = 0; i <= orbitPoints; i++) {
          const theta = (i / orbitPoints) * Math.PI * 2;
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
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, isLowDetail ? 32 : 64);
        
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const dist = Math.sqrt(vx * vx + vy * vy);
          const norm = (dist - innerRadius) / (outerRadius - innerRadius);
          uv.setXY(i, norm, 0.5);
        }

        let ringMat;
        if (!isLowDetail && data.ringTexture && textures[data.ringTexture]) {
          ringMat = new THREE.MeshPhongMaterial({
            map: textures[data.ringTexture],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            shininess: 5
          });
        } else {
          ringMat = new THREE.MeshLambertMaterial({
            color: 0xc5ab6e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
          });
        }
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        if (!isLowDetail) {
          ringMesh.castShadow = true;
          ringMesh.receiveShadow = true;
        }
        planetContainer.add(ringMesh);
      }

      const planetMoons = [];
      if (data.moons) {
        data.moons.forEach(moonData => {
          const moonGeo = new THREE.SphereGeometry(moonData.size, isLowDetail ? 8 : 16, isLowDetail ? 8 : 16);
          let moonMat;
          if (!isLowDetail && moonData.texture && textures[moonData.texture]) {
            moonMat = new THREE.MeshPhongMaterial({ map: textures[moonData.texture], shininess: 0 });
          } else {
            moonMat = new THREE.MeshLambertMaterial({ color: moonData.color || 0x888888 });
          }
          const moonMesh = new THREE.Mesh(moonGeo, moonMat);
          if (!isLowDetail) {
            moonMesh.castShadow = true;
            moonMesh.receiveShadow = true;
          }
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
    const starsCount = isLowDetail ? 2000 : 5000;
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

      if (trackedPlanetRef.current && planets[trackedPlanetRef.current]) {
        const targetPos = planets[trackedPlanetRef.current].container.position;
        controls.target.lerp(targetPos, 0.1);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    if (!isLoading) {
      animate();
    }

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
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
  }, [isLoading, isLowDetail]);

  const selectPlanet = (name) => {
    setTrackedPlanet(name);
    trackedPlanetRef.current = name;
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-black overflow-hidden relative">
      {/* UI Overlay for Planet Selection */}
      <div className="absolute top-4 right-4 z-40 flex flex-wrap justify-end gap-1 max-w-[200px] md:max-w-none">
        <button
          onClick={() => selectPlanet(null)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
            trackedPlanet === null 
              ? "bg-white text-black border-white" 
              : "bg-black/40 text-white/70 border-white/20 hover:bg-black/60"
          }`}
        >
          FREE CAM
        </button>
        {Object.keys(PLANET_DATA).map(name => (
          <button
            key={name}
            onClick={() => selectPlanet(name)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
              trackedPlanet === name 
                ? "bg-white text-black border-white" 
                : "bg-black/40 text-white/70 border-white/20 hover:bg-black/60"
            }`}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white font-mono p-6">
          <div className="w-full max-w-xs space-y-4">
            <div className="text-center text-xs tracking-widest uppercase opacity-50">Initializing Solar Map</div>
            <div className="h-1 w-full bg-gray-900 overflow-hidden rounded-full border border-gray-800">
              <div 
                className="h-full bg-white transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] opacity-40">
              <span>Sector {Math.floor(loadingProgress * 2.4)}</span>
              <span>{Math.round(loadingProgress)}%</span>
            </div>
          </div>
        </div>
      )}
      {isLowDetail && !isLoading && (
        <div className="absolute top-4 left-4 z-40 bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1 rounded text-[10px] text-white/60 pointer-events-none font-mono">
          LOW DETAIL MODE (SLOW NETWORK DETECTED)
        </div>
      )}
    </div>
  );
}
