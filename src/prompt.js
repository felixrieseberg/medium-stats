function prompt(question = '') {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

module.exports = { prompt }
