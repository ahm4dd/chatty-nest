module.exports = async function () {
  const globalState = globalThis as typeof globalThis & {
    __TEARDOWN_MESSAGE__?: string;
  };

  if (globalState.__TEARDOWN_MESSAGE__) {
    console.log(globalState.__TEARDOWN_MESSAGE__);
  }
};
