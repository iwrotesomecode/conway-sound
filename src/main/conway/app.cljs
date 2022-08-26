(ns conway.app
  (:require ;; [helix.core :refer [defnc $ <>]]
            ;; [helix.hooks :as hooks]
            ;; [helix.dom :as d]
            ;; ["react-dom" :as dom]
   [clojure.string :as str]
   [conway.patterns :refer [copperhead lobster glider-1a glider-1b glider-2a glider-2b]]
   ;; [conway.random :refer [random]]
   ["/conway/audio" :as wa]))

(defn get-cell-color
  "Get rgb color from css variables for a named cell, e.g. 'cell1a'"
  [cell]
  (let [style (->> (.-body js/document)
                   (.getComputedStyle js/window))]
    (.getPropertyValue style (str "--" cell))))

(defn get-canvas-context-from-id
  [id]
  (let [canvas (.getElementById js/document id)
        number (str/replace id #"[^\d]" "")]
    {:canvas canvas
     :width (.-width canvas)
     :height (.-height canvas)
     :color-1 (get-cell-color (str "cell" number "a"))
     :color-2 (get-cell-color (str "cell" number "b"))
     :ctx (.getContext canvas "2d")}))

(def canvas-1 (get-canvas-context-from-id "canvas-1"))
(def canvas-2 (get-canvas-context-from-id "canvas-2"))
(def canvas-3 (get-canvas-context-from-id "canvas-3"))
(def width (:width canvas-1))
(def height (:height canvas-1))
(defn init-board
  [res]
  (let [row-width (/ height res)
        col-height (/ height res)]
    (vec (repeatedly (* row-width col-height) #(rand-int 2)))))
(def board-1 (atom glider-1a))
(def board-2 (atom copperhead))
(def board-3 (atom lobster))
(def counter (atom 0))

(def game-1 {:canvas canvas-1
             :board board-1
             :res 200
             :col-height (/ width 200)
             :row-width (/ height 200)})
(def game-2 {:canvas canvas-2
             :board board-2
             :res 50
             :col-height (/ width 50)
             :row-width (/ height 50)})
(def game-3 {:canvas canvas-3
             :board board-3
             :res 20
             :col-height (/ width 20)
             :row-width (/ height 20)})

(defn moore-neighborhood
  [game idx]
  (let [board (deref (:board game))
        row-width (:row-width game)
        col-height (:col-height game)
        row (int (/ idx row-width))
        col (mod idx row-width)
        offsets [-1 0 1]]
    (for [dx offsets dy offsets
          :when (not= [dx dy] [0 0])
          :let [r (mod (+ (+ row dy) row-width) row-width)
                c (mod (+ (+ col dx) col-height) col-height)]]
      (get board (+ (* r row-width) c)))))

(defn num-neighbors
  [game idx]
  (count (filter pos? (moore-neighborhood game idx))))

(defn next-cell
  [game idx val]
  (let [n (num-neighbors game idx)]
    (cond
      (and (pos? val) (< n 2)) 0
      (and (pos? val) (<= 2 n 3)) (inc val)
      (and (pos? val) (> n 3)) 0
      (and (= 0 val) (= n 3)) 1
      :else 0)))

(defn next-gen
  [game]
  (reset! (:board game) (into [] (for [[i cell] (map-indexed vector (deref (:board game)))]
                                   (next-cell game i cell)))))

;; (defn test-moore-neighborhood
;;   [board idx]
;;   (let [row (int (/ idx row-width))
;;         col (mod idx row-width)
;;         offsets [-1 0 1]]
;;     (doseq [dx offsets dy offsets
;;             :when (not= [dx dy] [0 0])
;;             :let [r (mod (+ (+ row dy) row-width) row-width)
;;                   c (mod (+ (+ col dx) col-height) col-height)]]
;;       (set! (.-fillStyle (:ctx canvas-1)) "rgba(255,255,255,0.5)")
;;       (.fillRect (:ctx canvas-1) (* c res) (* r res) res res))))

(defn draw-board
  [game]
  (let [canvas (:canvas game)
        ctx (:ctx canvas)
        color-1 (:color-1 canvas)
        color-2 (:color-2 canvas)
        board (deref (:board game))
        row-width (:row-width game)
        res (:res game)]
    (.clearRect ctx 0 0 width height)
    (doseq [[idx cell] (keep-indexed (fn [j val] (when (pos? val) [j val])) board)
            :let [row (int (/ idx row-width))
                  col (mod idx row-width)]]
      (cond
        (> cell 1) (set! (.-fillStyle ctx) color-2)
        :else (set! (.-fillStyle ctx) color-1))
      (.fillRect ctx (* col res) (* row res) res res))))

(defn draw-board-arc
  [game]
  (let [canvas (:canvas game)
        ctx (:ctx canvas)
        color-1 (:color-1 canvas)
        color-2 (:color-2 canvas)
        board (deref (:board game))
        row-width (:row-width game)
        res (:res game)]
    (.clearRect ctx 0 0 width height)
    (doseq [[idx cell] (keep-indexed (fn [j val] (when (pos? val) [j val])) board)
            :let [row (int (/ idx row-width))
                  col (mod idx row-width)]]
      (cond
        (> cell 1) (set! (.-fillStyle ctx) color-2)
        :else (set! (.-fillStyle ctx) color-1))
      (.beginPath ctx)
      (.arc ctx (+ (* col res) (/ res 2)) (+ (* row res) (/ res 2)) (/ res 2) 0 (* 2 js/Math.PI))
      (.fill ctx))))

;; (defn clear-moore-test
;;   [board]
;;   (.clearRect (:ctx canvas-1) 0 0 width height)
;;   (draw-board board canvas-1))
(def intervalID-1 (atom nil))
(def intervalID-2 (atom nil))
(def intervalID-3 (atom nil))
(def timeout-1 (atom nil))
(def timeout-2 (atom nil))
(def transition-time 800)
(defn game-loop-1 []
  ;; (js/console.log @counter)
  (when (= @counter 33) (reset! board-1 glider-2b))
  ;;(when (= @counter 61) (reset! board-1 glider-1b))
  (when (= @counter 65) (reset! board-1 glider-1a))
  (when (= @counter 95) (reset! board-1 glider-2a))
  (when (= @counter 128) (reset! board-1 glider-1b)
        (wa/updateLop 600))
  (when (= @counter 140) (reset! counter 0) (reset! board-1 glider-1a)
        (wa/updateLop 4000))
  (draw-board-arc game-1)
  (wa/processNotes (clj->js (deref (:board game-1))))
  (next-gen game-1)
  (swap! counter inc))

(defn game-loop-2 []
  (draw-board-arc game-2)
  (wa/processNotes (clj->js (deref (:board game-2))))
  (next-gen game-2))

(defn game-loop-3 []
  (draw-board-arc game-3)
  (next-gen game-3))

(def volume (.getElementById js/document "volume"))

(defn update-gain []
  (wa/updateGain (clj->js (.-value volume))))

(defn begin []
  (wa/initAudio)
  (update-gain)
  (wa/play)
  (set! (.-disabled (.getElementById js/document "stop")) false)
  (set! (.-disabled (.getElementById js/document "start")) true)
  (game-loop-1)
  (reset! intervalID-1 (.setInterval js/window game-loop-1 transition-time))
  (reset! timeout-1 (-> (fn [] (reset! intervalID-2 (.setInterval js/window game-loop-2 (/ transition-time 4))))
                        (js/setTimeout (* 16 transition-time)))) ;;33000
  (reset! timeout-2 (-> (fn [] (reset! intervalID-3 (.setInterval js/window game-loop-3 (/ transition-time 16))))
                        (js/setTimeout (* 65 transition-time))))) ;; 61000

(defn end []
  (.clearInterval js/window @intervalID-1)
  (.clearInterval js/window @intervalID-2)
  (.clearInterval js/window @intervalID-3)
  (.clearTimeout js/window @timeout-1)
  (.clearTimeout js/window @timeout-2)
  (wa/stop)
  (doseq [ctx (reduce
               (fn [acc el] (conj acc (:ctx el)))
               []
               [canvas-1 canvas-2 canvas-3])]
    (.clearRect ctx 0 0 width height))
  (set! (.-fillStyle (:ctx canvas-1)) "rgb(30,30,30)")
  (.beginPath (:ctx canvas-1))
  (.arc (:ctx canvas-1) (/ height 2) (/ height 2)  (/ height 2) 0 (* 2 js/Math.PI))
  (.fill (:ctx canvas-1))
  (set! (.-disabled (.getElementById js/document "stop")) true)
  (set! (.-disabled (.getElementById js/document "start")) false))

;; (defnc app []
;;   (<>
;;    (d/h2 "conway sounds")
;;    (d/div {:class "controls"}
;;           (d/button {:id "start" :on-click begin} "start")
;;           (d/button {:id "stop" :on-click end} "stop")
;;           (d/div  {:class "slider"}
;;                  (d/input {:type "range" :min 0 :max 1 :value 0.5 :step 0.01
;;                            :class "slider" :id "volume"})
;;                  (d/label {:for "volume"} "volume")))
;;    (d/div {:id "container" :class "container"}
;;           (d/canvas {:id "canvas-1" :width (:width canvas-properties) :height (:height canvas-properties)})
;;           ;; (d/canvas {:id "canvas-2" :width (:width canvas-properties) :height (:height canvas-properties)})
;;           ;; (d/canvas {:id "canvas-3" :width (:width canvas-properties) :height (:height canvas-properties)})
;;           )))
(defn ^:export init []
  ;;(dom/render ($ app) (js/document.getElementById "app"))
  (set! (.-disabled (.getElementById js/document "stop")) true)
  (set! (.-disabled (.getElementById js/document "start")) true)
  (.addEventListener (.getElementById js/document "start") "click" begin)
  (.addEventListener (.getElementById js/document "stop") "click" end)
  (.addEventListener volume "input" update-gain)
  (set! (.-fillStyle (:ctx canvas-1)) "rgb(30,30,30)")
  (.beginPath (:ctx canvas-1))
  (.arc (:ctx canvas-1) (/ height 2) (/ height 2)  (/ height 2) 0 (* 2 js/Math.PI))
  (.fill (:ctx canvas-1))
  (wa/initBuffer)
  (set! (.-disabled (.getElementById js/document "start")) false))
