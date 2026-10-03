// Which Chrome command triggers which chain — one implementation, used by the
// options page and the side panel.
//
// The mapping is not just "the Nth chain owns Ctrl+Shift+N": a chain whose key
// literally reads chain_5 owns slot 5, and only when that key is absent does the
// display order fall back to a slot. Getting this wrong shows a shortcut that
// does nothing when pressed, so it has to agree with background.js
// executeChainByNumber and live in one place.
function hotkeyChainCommandName(chainKey, orderedKeys, config, hasSlot) {
  if (chainKey === config.defaultChain) return "_execute_action";
  const literal = /^chain_(\d+)$/.exec(chainKey);
  if (literal && hasSlot(Number(literal[1]))) return `execute_chain_${literal[1]}`;
  const idx = (orderedKeys || []).indexOf(chainKey);
  const slot = idx + 1;
  // Only when chain_<slot> does not exist does execute_chain_<slot> mean "the
  // slot-th chain in display order".
  if (idx >= 0 && hasSlot(slot) && !config.chains[`chain_${slot}`]) return `execute_chain_${slot}`;
  return null;
}
