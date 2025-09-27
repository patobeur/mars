import * as THREE from "three";

export function createAnimationManager(model, animations) {
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};

    animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
    });

    let activeAction = null;

    function playAnimation(name, loop = THREE.LoopRepeat) {
        if (activeAction) {
            activeAction.fadeOut(0.5);
        }
        const action = actions[name];
        if (action) {
            action.reset().setLoop(loop).fadeIn(0.5).play();
            activeAction = action;
        }
    }

    function update(dt) {
        mixer.update(dt);
    }

    return { playAnimation, update, actions };
}