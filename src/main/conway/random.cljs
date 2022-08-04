(ns conway.random)

(def seedkey
  (or (-> (.. js/window -location -search)
          (js/URLSearchParams.)
          (.get "seed"))
      "conway"))

;; (def ^:private a (atom 0))
;; (def ^:private t (atom 0))

;; (defn mulberry32a
;;   [seed]
;;   (reset! a seed)
;;   (fn []
;;     (reset! a (+ @a 0x6D2B79F5))
;;     (reset! t (js/Math.imul (bit-xor @a (unsigned-bit-shift-right @a 15)) (bit-or 1 @a)))
;;     (reset! t  (bit-xor (+ @t (js/Math.imul (bit-xor @t (unsigned-bit-shift-right @t 7))
;;                                             (bit-or 61 @t)))
;;                         @t))
;;     (/ (unsigned-bit-shift-right (bit-xor @t (unsigned-bit-shift-right @t 14)) 0) 4294967296)))

(def ^:dynamic ^:private a1 0)
(def ^:dynamic ^:private t1 0)
(defn mulberry32  [seed]
  (set! a1 seed)
  (binding [a1 a1
            t1 t1]
    (fn []
      (set! a1 (+ a1 0x6D2B79F5))
      (let [_t (js/Math.imul (bit-xor a1 (unsigned-bit-shift-right a1 15)) (bit-or 1 a1))]
        (set! t1  (bit-xor (+ _t (js/Math.imul (bit-xor _t (unsigned-bit-shift-right _t 7))
                                               (bit-or 61 _t)))
                           _t))
        (/ (unsigned-bit-shift-right (bit-xor t1 (unsigned-bit-shift-right t1 14)) 0) 4294967296)))))

(def random (mulberry32 (seedkey)))
