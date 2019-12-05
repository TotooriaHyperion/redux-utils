export async function sleep(time: number) {
  return new Promise(rs => {
    setTimeout(rs, time);
  });
}
