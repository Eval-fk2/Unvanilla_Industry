import { BlockPermutation, world } from '@minecraft/server';
import { minerMk1Data } from './data';
import { minerMk1Structure } from './structure';

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * faceをdirectionに応じて回転させる
 * 基準(north)から時計回りに回転
 */
function rotateFace(face, direction) {
    const faceOrder = ['north', 'east', 'south', 'west'];
    const directionOffset = { north: 0, east: 1, south: 2, west: 3 };
    const idx = faceOrder.indexOf(face);
    if (idx === -1) return face; // up/downはそのまま
    return faceOrder[(idx + directionOffset[direction]) % 4];
};

/**
 * faceの反対方向を返す
 */
function oppositeFace(face) {
    const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' };
    return opposite[face];
};

/**
 * localPosをcenterOffset基準で回転させてワールド座標を返す
 */
function rotatePos(localPos, centerOffset, originPos, direction) {
    const cx = localPos.x - centerOffset.x;
    const cy = localPos.y - centerOffset.y;
    const cz = localPos.z - centerOffset.z;

    let rx, rz;
    switch (direction) {
        case 'north': rx =  cx; rz =  cz; break;
        case 'east':  rx =  cz; rz = -cx; break;
        case 'south': rx = -cx; rz = -cz; break;
        case 'west':  rx = -cz; rz =  cx; break;
    };

    return {
        x: originPos.x + rx,
        y: originPos.y + cy,
        z: originPos.z + rz
    };
};

/**
 * posを文字列キー化する（オブジェクト比較用）
 */
function posKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
};

/**
 * slotDataから初期スロット状態を生成する
 */
function initSlots(slotData) {
    const slots = [];
    for (const slot of slotData) {
        slots[slot.slotIndex] = {
            slotType: slot.slotType,
            id: null,
            count: 0,
            connectId: null
        };
    };
    return slots;
};

// ============================================================
// MinerMk1Node
// ============================================================

export class MinerMk1Node {
    /**
     * @param {Object} pos        - 設置座標 {x, y, z}（機械の中心）
     * @param {string} direction  - 設置方向 'north'|'east'|'south'|'west'
     * @param {Object} dimension  - Minecraftのdimensionオブジェクト
     * @param {Array}  worldUnits - 全Unitインスタンスの配列（main.jsから渡す）
     * @param {Map}    powerNetworks - 全電力ネットワークのMap（main.jsから渡す）
     */
    constructor(pos, direction, dimension, worldUnits, powerNetworks) {
        this.unitData      = minerMk1Data;
        this.unitStructure = minerMk1Structure;
        this.unitId        = this.unitData.id;
        this.id            = `${this.unitId}_${pos.x}_${pos.y}_${pos.z}`;
        this.pos           = pos;
        this.direction     = direction;
        this.dimension     = dimension;
        this.worldUnits    = worldUnits;
        this.powerNetworks = powerNetworks;

        // スロット
        this.input  = initSlots(this.unitData.input);
        this.output = initSlots(this.unitData.output);

        // 電力
        this.powerNetworkId = null;

        // レシピ
        this.currentRecipeId = null;
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
        this.status          = 'IDLE';
        // 'IDLE'           : 待機中（レシピ未設定 or 素材待ち）
        // 'RUNNING'        : 動作中
        // 'WAITING_OUTPUT' : 出力スロットが満杯
        // 'BLACKOUT'       : 停電中

        // blockSensor
        this.detectedBlockId = null;

        // ワールドへのブロック設置
        this.setStructure();

        // 接続先の探索
        this.searchConnect();

        // 電力ネットワークへの参加
        this.joinPowerNetwork();

        // 自分をworldUnitsに登録
        this.worldUnits.push(this);
    };

    // ----------------------------------------------------------
    // ブロック設置
    // ----------------------------------------------------------

    setStructure() {
        for (const block of this.unitStructure.blocks) {
            const worldPos = rotatePos(
                block.localPos,
                this.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            this.dimension.setBlockPermutation(
                worldPos,
                BlockPermutation.resolve(block.id, {
                    'minecraft:cardinal_direction': this.direction
                })
            );
            // ブロックにインスタンスIDを書き込む（破壊検知用）
            const placedBlock = this.dimension.getBlock(worldPos);
            if (placedBlock) {
                placedBlock.setPermutation(
                    placedBlock.permutation.withState('uvi:unit_id', this.id)
                );
            };
        };
    };

    // ----------------------------------------------------------
    // 接続先探索
    // ----------------------------------------------------------

    searchConnect() {
        // output → コンベアの入力口を探す
        for (const slot of this.unitData.output) {
            const slotWorldPos = rotatePos(
                slot.localPos,
                this.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            const rotatedFace = rotateFace(slot.face, this.direction);

            // 面の先のブロック座標
            const detectPos = {
                x: slotWorldPos.x + (rotatedFace === 'east'  ? 1 : rotatedFace === 'west'  ? -1 : 0),
                y: slotWorldPos.y,
                z: slotWorldPos.z + (rotatedFace === 'south' ? 1 : rotatedFace === 'north' ? -1 : 0)
            };

            // 接続相手が向いている方向（自分の出力面の逆）
            const connectDirection = oppositeFace(rotatedFace);

            const connectUnit = this.worldUnits.find(unit =>
                unit.unitData.type === 'CONVEYOR' &&
                unit.direction     === connectDirection &&
                posKey(unit.pos)   === posKey(detectPos)
            );

            if (!connectUnit) continue;

            // 双方向に接続情報を書き込む
            this.output[slot.slotIndex].connectId      = connectUnit.id;
            connectUnit.input[0].connectId             = this.id;
        };

        // electrode → 電線または他機械のelectrodeを探す
        for (const electrode of this.unitData.electrode) {
            const electrodeWorldPos = rotatePos(
                electrode.localPos,
                this.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            const rotatedFace = rotateFace(electrode.face, this.direction);

            const detectPos = {
                x: electrodeWorldPos.x + (rotatedFace === 'east'  ? 1 : rotatedFace === 'west'  ? -1 : 0),
                y: electrodeWorldPos.y,
                z: electrodeWorldPos.z + (rotatedFace === 'south' ? 1 : rotatedFace === 'north' ? -1 : 0)
            };

            const connectUnit = this.worldUnits.find(unit =>
                posKey(unit.pos) === posKey(detectPos) &&
                (unit.unitData.type === 'POWER_CABLE' || unit.unitData.electrode)
            );

            if (connectUnit) {
                this.electrode = connectUnit.id;
            };
        };
    };

    // ----------------------------------------------------------
    // 電力ネットワーク
    // ----------------------------------------------------------

    joinPowerNetwork() {
        // 接続先のelectrodeが既にネットワークに所属しているか確認
        if (this.electrode) {
            const connectUnit = this.worldUnits.find(u => u.id === this.electrode);
            if (connectUnit?.powerNetworkId) {
                // 既存ネットワークに参加
                this.powerNetworkId = connectUnit.powerNetworkId;
                const network = this.powerNetworks.get(this.powerNetworkId);
                network?.addMember(this.id);
                return;
            };
        };

        // 接続先がなければ自分で新規ネットワークを作成
        const newNetworkId = `network_${this.id}`;
        this.powerNetworkId = newNetworkId;
        // PowerNetworkクラスはmain.js側で管理する想定
        // ここではIDだけ払い出してmain.js側に通知する
        this.powerNetworks.set(newNetworkId, { id: newNetworkId, memberIds: [this.id] });
    };

    // ----------------------------------------------------------
    // blockSensor
    // ----------------------------------------------------------

    updateBlockSensor() {
        const sensorLocalPos = {
            x: this.unitData.blockSensor.x,
            y: this.unitData.blockSensor.y,
            z: this.unitData.blockSensor.z
        };
        const sensorWorldPos = rotatePos(
            sensorLocalPos,
            this.unitStructure.centerOffset,
            this.pos,
            this.direction
        );
        const detectedBlock = this.dimension.getBlock(sensorWorldPos);
        this.detectedBlockId = detectedBlock?.typeId ?? null;
    };

    // ----------------------------------------------------------
    // レシピ
    // ----------------------------------------------------------

    /**
     * プレイヤーがUIで選択したレシピを設定する
     * @param {string} recipeId
     * @param {Object} recipes  - レシピ定義オブジェクト
     */
    setRecipe(recipeId, recipes) {
        if (!this.unitData.usableRecipe.includes(recipeId)) return;
        this.currentRecipeId = recipeId;
        this.status          = 'IDLE';
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
    };

    /**
     * レシピの入力条件を満たしているか確認する
     * @param {Object} recipe
     */
    checkInputs(recipe) {
        for (const input of recipe.inputs) {
            if (input.type === 'blockDetect') {
                if (this.detectedBlockId !== input.blockId) return false;
            };
            if (input.type === 'item') {
                const slot = this.input[input.slotIndex];
                if (!slot || slot.id !== input.itemId || slot.count < input.count) return false;
            };
        };
        return true;
    };

    /**
     * 出力スロットに空きがあるか確認する
     * @param {Object} recipe
     * @param {number} maxStack - スタック上限（デフォルト64）
     */
    checkOutputs(recipe, maxStack = 64) {
        for (const output of recipe.outputs) {
            const slot = this.output[output.slotIndex];
            if (!slot) return false;
            if (slot.id !== null && slot.id !== output.itemId) return false;
            if ((slot.count + output.count) > maxStack) return false;
        };
        return true;
    };

    /**
     * レシピ1サイクル分の処理を実行する
     * @param {Object} recipe
     */
    processRecipe(recipe) {
        // 入力消費
        for (const input of recipe.inputs) {
            if (input.type === 'item') {
                this.input[input.slotIndex].count -= input.count;
                if (this.input[input.slotIndex].count <= 0) {
                    this.input[input.slotIndex].id    = null;
                    this.input[input.slotIndex].count = 0;
                };
            };
        };
        // 出力生産
        for (const output of recipe.outputs) {
            const slot = this.output[output.slotIndex];
            slot.id     = output.itemId;
            slot.count += output.count;
        };
    };

    /**
     * tick処理（main.jsのループから毎tick呼ぶ）
     * @param {number} currentTick
     * @param {Object} recipes       - レシピ定義オブジェクト
     * @param {Map}    powerNetworks
     */
    tick(currentTick, recipes, powerNetworks) {
        if (!this.currentRecipeId) return;

        const recipe  = recipes[this.currentRecipeId];
        const network = powerNetworks.get(this.powerNetworkId);

        // 停電チェック
        if (network && !network.isPowered) {
            this.status = 'BLACKOUT';
            return;
        };

        // blockSensor更新
        this.updateBlockSensor();

        // 入力チェック
        if (!this.checkInputs(recipe)) {
            this.status = 'IDLE';
            this.cycleStartTick = null;
            this.cycleEndTick   = null;
            return;
        };

        // 出力チェック
        if (!this.checkOutputs(recipe)) {
            this.status = 'WAITING_OUTPUT';
            return;
        };

        // サイクル開始
        if (this.cycleStartTick === null) {
            this.cycleStartTick = currentTick;
            this.cycleEndTick   = currentTick + recipe.durationTicks;
            this.status         = 'RUNNING';
        };

        // サイクル完了チェック
        if (currentTick >= this.cycleEndTick) {
            // チャンクアンロード中に複数サイクル経過した場合も考慮
            const completedCycles = Math.floor(
                (currentTick - this.cycleStartTick) / recipe.durationTicks
            );
            for (let i = 0; i < completedCycles; i++) {
                if (!this.checkOutputs(recipe)) {
                    this.status = 'WAITING_OUTPUT';
                    break;
                }
                this.processRecipe(recipe);
            };
            // 次サイクルの開始時刻を更新
            this.cycleStartTick = this.cycleStartTick + recipe.durationTicks * completedCycles;
            this.cycleEndTick   = this.cycleStartTick + recipe.durationTicks;
        };
    };

    // ----------------------------------------------------------
    // UIを開く
    // ----------------------------------------------------------

    /**
     * レシピ選択UIを開く（UIの実装はui/recipeSelectUI.jsで行う）
     * @param {Object} player
     */
    openUI(player) {
        // import { showRecipeSelectUI } from '../../ui/recipeSelectUI.js'
        // showRecipeSelectUI(player, this)
        // UIファイル実装後にコメントアウトを外す
    }

    // ----------------------------------------------------------
    // 破壊時の後処理
    // ----------------------------------------------------------

    onDestroy(powerNetworks) {
        // 接続先のconnectIdをリセット
        for (const slot of this.output) {
            if (!slot?.connectId) continue;
            const connectUnit = this.worldUnits.find(u => u.id === slot.connectId);
            if (connectUnit) {
                const targetSlot = connectUnit.input.find(s => s?.connectId === this.id);
                if (targetSlot) targetSlot.connectId = null;
            };
        };
        for (const slot of this.input) {
            if (!slot?.connectId) continue;
            const connectUnit = this.worldUnits.find(u => u.id === slot.connectId);
            if (connectUnit) {
                const targetSlot = connectUnit.output.find(s => s?.connectId === this.id);
                if (targetSlot) targetSlot.connectId = null;
            };
        };

        // 電力ネットワークから離脱
        const network = powerNetworks.get(this.powerNetworkId);
        if (network) {
            network.memberIds = network.memberIds.filter(id => id !== this.id);
            if (network.memberIds.length === 0) {
                powerNetworks.delete(this.powerNetworkId);
            };
        };

        // worldUnitsから自分を削除
        const idx = this.worldUnits.findIndex(u => u.id === this.id);
        if (idx !== -1) this.worldUnits.splice(idx, 1);
    };

    // ----------------------------------------------------------
    // シリアライズ
    // ----------------------------------------------------------

    serialize() {
        return {
            type:            'MinerMk1Node',
            id:              this.id,
            unitId:          this.unitId,
            pos:             this.pos,
            direction:       this.direction,
            input:           this.input,
            output:          this.output,
            electrode:       this.electrode,
            powerNetworkId:  this.powerNetworkId,
            currentRecipeId: this.currentRecipeId,
            cycleStartTick:  this.cycleStartTick,
            cycleEndTick:    this.cycleEndTick,
            status:          this.status,
            detectedBlockId: this.detectedBlockId
        };
    };

    /**
     * シリアライズデータからインスタンスを復元する
     * setStructure・searchConnect・joinPowerNetworkは呼ばない
     * （ワールドには既にブロックが存在するため）
     */
    static fromJSON(data, dimension, worldUnits, powerNetworks) {
        const node = new MinerMk1Node(
            data.pos,
            data.direction,
            dimension,
            worldUnits,
            powerNetworks
        );
        // constructorで自動実行された処理を上書き
        node.id              = data.id;
        node.input           = data.input;
        node.output          = data.output;
        node.electrode       = data.electrode;
        node.powerNetworkId  = data.powerNetworkId;
        node.currentRecipeId = data.currentRecipeId;
        node.cycleStartTick  = data.cycleStartTick;
        node.cycleEndTick    = data.cycleEndTick;
        node.status          = data.status;
        node.detectedBlockId = data.detectedBlockId;
        return node;
    };
};