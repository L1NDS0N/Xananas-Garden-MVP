import React from 'react';

function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="256"
      height="256"
      fill="none"
      viewBox="0 0 256 256"
    >
      <rect width="256" height="256" fill="#DE818E" rx="30"></rect>
      <path
        fill="#000"
        d="M159.932 207.819c-4.142 2.669-12.798 6.349-17.14 7.287-6.233 1.346-10.261 1.292-15.696-.209-2.4-.662-6.96-1.198-10.132-1.189-10.066.027-13.039-1.93-17.065-11.231-3.077-7.109-3.43-10.853-1.6-17.014l1.235-4.164-5.635 2.97c-11 5.796-16.081 6.167-27.365 1.996-12.123-4.482-20.095-11.898-22.646-21.065-1.552-5.58-1.374-9.571.69-15.44.835-2.373 1.81-6.627 2.165-9.453.995-7.895 2.58-10.798 9.007-16.499 4.293-3.808 6.486-5.275 10.866-7.271 3.018-1.375 5.791-2.768 6.162-3.095.465-.411-.182-1.546-2.091-3.666-4.773-5.301-7.234-13.886-5.33-18.6.444-1.1 1.697-3.1 2.785-4.444 1.41-1.742 2.238-3.994 2.889-7.858 1.5-8.91 2.769-11.024 11.19-18.645 7.195-6.511 7.233-6.536 12.466-8.057 6.443-1.873 11.829-.947 16.649 2.862 4.138 3.27 4.844 3.433 11.216 2.59 7.362-.975 10.531-.224 13.128 3.114 1.148 1.475 2.235 2.371 2.541 2.096.293-.265 1.91-2.337 3.593-4.604 3.906-5.264 6.021-7.163 10.34-9.287 6.749-3.319 9.685-2.628 27.402 6.445 12.262 6.28 15.062 10.513 13.028 19.697-.725 3.274-.649 5.592.297 9.026.7 2.541 1.066 5.886.815 7.433-.584 3.582-3.52 9.032-7.024 13.033-1.503 1.718-2.579 3.295-2.389 3.505.189.21 1.284.525 2.434.7 7.397 1.126 14.041 5.297 19.778 12.416 5.52 6.85 7.322 11.741 6.809 18.475-.499 6.538-4.496 16.476-7.839 19.485-1.386 1.249-4.536 5.858-7.655 11.202-5.172 8.862-5.382 9.128-8.786 11.089-4.18 2.409-9.859 3.146-14.392 1.869-6.15-1.734-5.808-1.927-5.288 2.995.987 9.341-2.343 16.949-9.412 21.506zm3.853-13.331c2.303-6.767.284-15.85-5.063-22.771-3.918-5.073-7.38-10.067-13.292-19.169-4.832-7.44-5.51-8.195-6.535-7.272-.451.407-1.698.893-2.77 1.082-1.909.337-1.932.454-1.124 5.742.453 2.969.64 5.393.415 5.387-.224-.007-1.236-2.158-2.248-4.781-1.769-4.583-1.931-4.799-4.174-5.558-3.733-1.263-7.125.312-8.116 3.768-.3 1.048-1.693 3.313-3.095 5.033-3.619 4.442-14.713 27.544-15.721 32.74-.961 4.953.33 10.837 3.319 15.117 2.445 3.502 4.128 4.68 6.944 4.861 2.796.179 3.23-.313 2.068-2.341-.528-.921-.954-3.133-.947-4.916l.013-3.241 1.365 3.227c1.905 4.503 4.386 6.295 10.954 7.915 7.377 1.82 12.091 1.849 17.867.11 10.907-3.284 17.954-8.509 20.14-14.933zm27.125-23.284c.709-1.221 1.311-2.318 1.338-2.437.027-.119-1.81-.316-4.081-.438-4.505-.243-5.486-1.101-1.652-1.444 4.26-.382 6.682-2.14 11.948-8.673 8.48-10.52 10.983-20.053 7.288-27.762-4.095-8.544-9.526-13.868-17.074-16.74-6.208-2.361-8.66-2.279-12.431.419-2.366 1.693-4.056 2.33-6.499 2.451-4.362.217-6.581.989-14.074 4.896-7.882 4.11-8.408 4.6-8.594 7.995l-.151 2.774 8.828 1.179c4.855.649 10.592 1.364 12.748 1.59 2.156.226 3.899.693 3.872 1.038-.026.345-6.518.368-14.426.052-7.908-.317-14.66-.322-15.005-.012-.344.311-.314 1.633.067 2.939.382 1.306.783 2.917.893 3.58.501 3.026 15.762 23.641 21.93 29.622 1.969 1.91 4.81 3.915 6.607 4.664 3.361 1.4 8.896 1.871 11.288.961 2.143-.816 5.71-4.121 7.18-6.654zm-6.861-71.75c4.472-6.137 5.329-10.11 3.095-14.346-.801-1.52-1.043-1.526-3.253-.072-3.426 2.252-4.137 1.614-1.594-1.43 2.854-3.42 5.006-8.771 4.969-12.36-.042-4.192-2.487-6.507-12.331-11.676-16.068-8.438-18.357-8.647-25.386-2.322-6.842 6.159-12.597 16.231-14.905 26.088-.874 3.73-1.407 19.988-.926 28.186l.2 3.393 2.569-.118c2.393-.11 3.021-.521 9.114-5.952 4.919-4.385 6.326-5.409 5.666-4.123-.715 1.394-8.646 11.336-10.111 12.675-.22.2.713 1.599 2.072 3.107l2.469 2.743 5.969-3.31c3.282-1.82 9.386-4.609 13.564-6.197 4.179-1.588 8.282-3.316 9.118-3.841 2.123-1.332 6.477-6.02 9.701-10.445zm-45.218 40.386c.039-1.527-.296-2.03-1.935-2.898-2.815-1.492-3.461-3.544-.729-2.315 3.888 1.748 8.351-2.902 7.115-7.414-.725-2.648-3.478-4.59-5.689-4.016l-1.701.442 1.06-1.509c1.46-2.081.066-4.001-2.566-3.537-1.131.199-3.068-.198-4.306-.881-2.972-1.642-5.161-1.073-5.909 1.538-.308 1.075-1.122 2.46-1.808 3.078-1.524 1.372-1.733 3.163-.526 4.503.718.798.074.945-3.163.722-5.885-.405-6.724 2.59-1.242 4.43 2.489.835 2.566.923 3.01 3.412 1.499 8.394 1.479 8.345 3.384 8.401 1.419.042 1.844-.235 2.219-1.447.419-1.35.598-1.335 1.814.151 1.166 1.426 1.629 1.503 3.406.568 1.132-.595 2.968-.864 4.081-.596 2.434.585 3.42-.16 3.485-2.632zm-29.635 23.45c1.866-3.541 3.491-7.34 3.61-8.442.118-1.102 1.028-4.122 2.022-6.71 1.941-5.059 1.695-5.204-3.195-1.887-5.387 3.655-5.484 2.729-.214-2.045 5.485-4.969 6.871-7.407 4.616-8.122-1.306-.413-11.305.79-21.29 2.562-3.44.61-5.508.731-4.594.269 3.39-1.719 10.721-3.895 15.816-4.696l5.254-.825.564-2.481c.563-2.479.562-2.481-2.591-4.632-1.735-1.184-5.015-2.663-7.289-3.286-6.85-1.878-23.848-5.423-25.728-5.366-2.764.085-10.25 3.817-14.96 7.459-6.205 4.799-8.505 8.708-9.2 15.64-.3 2.981-1.14 7.124-1.87 9.206-2.683 7.664-2.265 14.022 1.173 17.841 1.576 1.75 2.837 2.177 8.78 2.974 3.817.512 7.408 1.062 7.98 1.223 1.723.486-3.386 1.662-7.614 1.754-2.07.045-3.785.352-3.81.681-.088 1.162 8.052 5.928 13.915 8.147 6.514 2.465 10.731 2.677 15.962.802 10.223-3.664 17.337-9.963 22.663-20.066zm8.765-46.54c-1.13-1.601-3.984-5.327-6.341-8.28-9.657-12.096-8.006-12.43 2.785-.562l6.97 7.666 4.035-1.683 4.034-1.682.361-3.76c.199-2.067.455-7.562.57-12.209.28-11.325 1.336-18.685 3.368-23.475 2.023-4.77 2.014-7.832-.028-10.1-1.921-2.133-4.723-2.413-11.696-1.17-5.849 1.042-10.647-.023-13.32-2.958-3.182-3.494-10.151-3.989-15.9-1.13-3.406 1.694-11.74 9.225-13.953 12.609-1.86 2.845-3.404 7.911-4.207 13.814-.473 3.477-.228 4.577 1.933 8.674 2.324 4.405 2.359 4.607.566 3.297-1.05-.767-2.813-2.398-3.917-3.624-1.675-1.86-2.178-2.077-3.035-1.305-1.671 1.505-1.986 6.01-.704 10.071.916 2.9 2.1 4.815 5.047 8.165l3.85 4.377 12.642 3.516c6.954 1.935 14.682 4.527 17.175 5.761 4.73 2.342 6.258 2.778 6.332 1.807.035-.461-10.721-8.202-13.956-10.044-.42-.239-.678-.711-.572-1.047.106-.337 3.334 1 7.173 2.97 11.1 5.698 11.155 5.718 12.049 4.392.609-.904.316-1.858-1.261-4.09zM30.075 39.873c0-1.367.114-2.702.342-4.004.228-1.302.472-2.604.732-3.906s.505-2.588.733-3.858c.26-1.302.39-2.636.39-4.003v-1.075c-.162-.13-.488-.407-.976-.83a68.147 68.147 0 01-1.66-1.611 584.913 584.913 0 00-1.953-2.05 32.281 32.281 0 01-1.905-2.393 20.867 20.867 0 01-1.416-2.393c-.358-.781-.537-1.53-.537-2.246v-.586c.033-.26.065-.488.098-.684.065-.227.179-.423.342-.586a.859.859 0 01.634-.244c.782 0 1.449.212 2.002.635.586.423 1.107.96 1.563 1.611.456.619.879 1.303 1.27 2.051a31 31 0 001.22 2.051c.456.618.944 1.14 1.465 1.562.553.424 1.204.635 1.953.635.749 0 1.432-.244 2.05-.732a10.335 10.335 0 001.759-1.807 50.907 50.907 0 001.758-2.392 18.12 18.12 0 012.001-2.393 9.692 9.692 0 012.442-1.855c.911-.489 1.97-.733 3.174-.733 0 .879-.212 1.677-.635 2.393-.39.716-.879 1.4-1.465 2.05a26.976 26.976 0 01-1.953 1.856 27.641 27.641 0 00-1.953 1.953 9.644 9.644 0 00-1.465 2.148c-.39.782-.586 1.644-.586 2.588 0 .456.325 1.09.977 1.905a38.862 38.862 0 002.392 2.685c.977.944 2.035 1.92 3.174 2.93 1.14.976 2.213 1.888 3.223 2.734a283.153 283.153 0 003.906 3.223c0 .065.016.244.049.537.032.26.049.44.049.537 0 .554-.13 1.058-.391 1.514-.228.456-.651.683-1.27.683-.065 0-.162-.016-.293-.048a.8.8 0 00-.195-.05l-1.123-.976c-.456-.456-.993-.96-1.611-1.514-.619-.553-1.27-1.123-1.953-1.708a73.16 73.16 0 00-1.953-1.71 47.756 47.756 0 00-1.71-1.464c-.52-.456-.895-.782-1.123-.977-.292-.26-.667-.57-1.123-.928-.455-.39-.911-.748-1.367-1.074a15.917 15.917 0 00-1.123-.879c-.325-.228-.504-.325-.537-.293l-1.074 1.075c-.26.293-.456.927-.586 1.904-.098.976-.195 2.132-.293 3.467a503.048 503.048 0 00-.293 4.15 35.463 35.463 0 01-.488 4.053c-.196 1.237-.505 2.262-.928 3.076-.423.814-.977 1.22-1.66 1.22-.619 0-1.09-.195-1.416-.585-.293-.39-.489-.863-.586-1.416a10.67 10.67 0 01-.147-1.758c.033-.586.05-1.074.05-1.465zm46.143-1.172a92.287 92.287 0 00-3.223 2.295 21.465 21.465 0 01-2.588 1.66c-.846.456-1.758.798-2.734 1.026-.944.227-2.116.341-3.516.341-3.027 0-5.273-.797-6.738-2.392-1.465-1.628-2.197-4.037-2.197-7.227 0-1.237.162-2.523.488-3.857a20.559 20.559 0 011.416-3.955 23.209 23.209 0 012.295-3.76 17.292 17.292 0 012.978-3.174 14.174 14.174 0 013.516-2.148 9.914 9.914 0 014.004-.83c2.344.228 4.183.814 5.517 1.758a8.692 8.692 0 013.028 3.564c.683 1.432 1.156 3.044 1.416 4.834.26 1.758.456 3.58.586 5.469.163 1.888.358 3.776.586 5.664.228 1.888.7 3.63 1.416 5.224-.423 1.075-.83 1.823-1.22 2.247-.359.455-.766.537-1.222.244-.455-.293-.992-1.01-1.611-2.149-.586-1.14-1.318-2.75-2.197-4.834zm-16.846-4.199c0 1.855.342 3.223 1.026 4.101.716.847 1.969 1.27 3.76 1.27 1.334 0 2.603-.228 3.808-.683 1.237-.489 2.311-1.14 3.223-1.954a9.784 9.784 0 002.197-3.027c.553-1.172.83-2.474.83-3.906 0-.586.016-1.4.049-2.442a17.143 17.143 0 00-.196-3.174c-.162-1.041-.472-1.936-.927-2.685-.456-.781-1.14-1.172-2.051-1.172-1.693 0-3.255.44-4.688 1.318a13.178 13.178 0 00-3.71 3.272 15.952 15.952 0 00-2.442 4.443c-.586 1.595-.879 3.142-.879 4.639zm26.172-5.957c0-.846.212-1.449.635-1.807.423-.39 1.106-.586 2.05-.586h.489c.097.521.211 1.123.342 1.807.13.684.325 1.383.585 2.1.26.716.57 1.383.928 2.001a4.597 4.597 0 001.319 1.417c.032-1.14.309-2.23.83-3.272a11.98 11.98 0 012.002-2.832 12.259 12.259 0 012.636-2.1c.977-.585 1.937-.976 2.881-1.171h1.074c1.563 0 2.898.358 4.004 1.074a8.438 8.438 0 012.735 2.734c.748 1.107 1.318 2.377 1.709 3.809.39 1.432.683 2.897.879 4.394.227 1.465.358 2.897.39 4.297.065 1.367.098 2.54.098 3.516h-3.565a90.413 90.413 0 00-.732-5.616 32.757 32.757 0 00-.391-2.245 28.036 28.036 0 00-.537-2.247 19.88 19.88 0 00-.634-1.953c-.228-.618-.489-1.14-.782-1.562l-.537-.537a12.036 12.036 0 00-1.269-1.27c-.196-.163-.31-.244-.342-.244-.977-.26-1.823-.065-2.54.586-.715.618-1.35 1.465-1.904 2.539-.553 1.074-1.009 2.295-1.367 3.662a72.11 72.11 0 00-.83 3.955 42.453 42.453 0 00-.488 3.272 43.655 43.655 0 01-.195 1.66c-.814.586-1.58.765-2.295.537-.716-.26-1.4-.781-2.051-1.563-.619-.78-1.188-1.757-1.71-2.93a49.156 49.156 0 01-1.366-3.71 92.764 92.764 0 01-1.172-4.004 264.345 264.345 0 01-.88-3.711zM134.812 38.7a91.85 91.85 0 00-3.223 2.295 21.505 21.505 0 01-2.588 1.66c-.846.456-1.758.798-2.734 1.026-.944.227-2.116.341-3.516.341-3.027 0-5.273-.797-6.738-2.392-1.465-1.628-2.198-4.037-2.198-7.227 0-1.237.163-2.523.489-3.857a20.492 20.492 0 011.416-3.955 23.203 23.203 0 012.295-3.76 17.286 17.286 0 012.978-3.174 14.178 14.178 0 013.516-2.148 9.911 9.911 0 014.004-.83c2.343.228 4.183.814 5.517 1.758a8.694 8.694 0 013.028 3.564c.683 1.432 1.155 3.044 1.416 4.834.26 1.758.455 3.58.586 5.469.162 1.888.358 3.776.586 5.664.227 1.888.699 3.63 1.416 5.224-.424 1.075-.831 1.823-1.221 2.247-.358.455-.765.537-1.221.244-.456-.293-.993-1.01-1.611-2.149-.586-1.14-1.319-2.75-2.197-4.834zm-16.846-4.199c0 1.855.342 3.223 1.025 4.101.716.847 1.97 1.27 3.76 1.27 1.335 0 2.604-.228 3.809-.683 1.237-.489 2.311-1.14 3.222-1.954a9.77 9.77 0 002.197-3.027c.554-1.172.831-2.474.831-3.906 0-.586.016-1.4.048-2.442a17.091 17.091 0 00-.195-3.174c-.163-1.041-.472-1.936-.928-2.685-.455-.781-1.139-1.172-2.05-1.172-1.693 0-3.256.44-4.688 1.318a13.188 13.188 0 00-3.711 3.272 15.946 15.946 0 00-2.441 4.443c-.586 1.595-.879 3.142-.879 4.639zm26.172-5.957c0-.846.211-1.449.634-1.807.424-.39 1.107-.586 2.051-.586h.489c.097.521.211 1.123.341 1.807.131.684.326 1.383.586 2.1.261.716.57 1.383.928 2.001a4.605 4.605 0 001.318 1.417c.033-1.14.31-2.23.83-3.272a12.004 12.004 0 012.002-2.832 12.267 12.267 0 012.637-2.1c.977-.585 1.937-.976 2.881-1.171h1.074c1.563 0 2.897.358 4.004 1.074a8.435 8.435 0 012.734 2.734c.749 1.107 1.319 2.377 1.709 3.809.391 1.432.684 2.897.879 4.394.228 1.465.358 2.897.391 4.297.065 1.367.098 2.54.098 3.516h-3.565a90.413 90.413 0 00-.732-5.616 32.757 32.757 0 00-.391-2.245 28.923 28.923 0 00-.537-2.247 19.607 19.607 0 00-.635-1.953c-.228-.618-.488-1.14-.781-1.562l-.537-.537a12.036 12.036 0 00-1.27-1.27c-.195-.163-.309-.244-.341-.244-.977-.26-1.823-.065-2.539.586-.717.618-1.351 1.465-1.905 2.539-.553 1.074-1.009 2.295-1.367 3.662a72.673 72.673 0 00-.83 3.955 42.049 42.049 0 00-.488 3.272 42.988 42.988 0 01-.196 1.66c-.813.586-1.578.765-2.295.537-.716-.26-1.399-.781-2.05-1.563-.619-.78-1.189-1.757-1.709-2.93a49.197 49.197 0 01-1.368-3.71 93.034 93.034 0 01-1.171-4.004 252.278 252.278 0 01-.879-3.711zM193.405 38.7a91.727 91.727 0 00-3.222 2.295 21.505 21.505 0 01-2.588 1.66c-.847.456-1.758.798-2.735 1.026-.944.227-2.116.341-3.515.341-3.028 0-5.274-.797-6.739-2.392-1.464-1.628-2.197-4.037-2.197-7.227 0-1.237.163-2.523.488-3.857a20.626 20.626 0 011.416-3.955 23.273 23.273 0 012.295-3.76 17.29 17.29 0 012.979-3.174 14.178 14.178 0 013.516-2.148 9.91 9.91 0 014.003-.83c2.344.228 4.183.814 5.518 1.758a8.684 8.684 0 013.027 3.564c.684 1.432 1.156 3.044 1.416 4.834a69.98 69.98 0 01.586 5.469c.163 1.888.358 3.776.586 5.664.228 1.888.7 3.63 1.416 5.224-.423 1.075-.83 1.823-1.22 2.247-.359.455-.765.537-1.221.244-.456-.293-.993-1.01-1.611-2.149-.586-1.14-1.319-2.75-2.198-4.834zm-16.845-4.199c0 1.855.341 3.223 1.025 4.101.716.847 1.969 1.27 3.76 1.27a10.67 10.67 0 003.808-.683c1.237-.489 2.312-1.14 3.223-1.954a9.785 9.785 0 002.197-3.027c.554-1.172.83-2.474.83-3.906 0-.586.017-1.4.049-2.442a17.091 17.091 0 00-.195-3.174c-.163-1.041-.472-1.936-.928-2.685-.456-.781-1.139-1.172-2.051-1.172-1.692 0-3.255.44-4.687 1.318a13.188 13.188 0 00-3.711 3.272 15.95 15.95 0 00-2.442 4.443c-.585 1.595-.878 3.142-.878 4.639zm35.546 8.3c.521-.357 1.14-.813 1.856-1.367a56.37 56.37 0 002.246-1.855 25 25 0 002.1-2.05c.651-.717 1.155-1.4 1.513-2.052.391-.683.586-1.318.586-1.904 0-.586-.293-1.074-.879-1.465-1.041 0-2.181.05-3.418.147a70.6 70.6 0 01-3.711.097 26.13 26.13 0 01-3.613-.341c-1.139-.196-2.165-.554-3.076-1.075a5.929 5.929 0 01-2.197-2.197c-.521-.976-.782-2.213-.782-3.71 0-1.759.326-3.337.977-4.737a12.988 12.988 0 012.686-3.76 18.859 18.859 0 013.71-2.88c1.4-.847 2.8-1.563 4.2-2.15a6.232 6.232 0 012.343 1.222 10.483 10.483 0 011.856 1.953c-.228.716-.684 1.27-1.367 1.66-.651.39-1.416.732-2.295 1.025l-2.686.928c-.944.325-1.806.765-2.588 1.318-.748.521-1.383 1.221-1.904 2.1-.521.846-.781 1.97-.781 3.37 0 1.04.26 1.806.781 2.294s1.205.83 2.051 1.025c.846.163 1.807.228 2.881.196a119.73 119.73 0 003.271-.244 38.93 38.93 0 013.321-.147c1.074-.032 2.034.098 2.88.39.847.261 1.514.7 2.002 1.32.521.618.782 1.53.782 2.734 0 .52-.179 1.188-.538 2.001-.325.814-.781 1.693-1.367 2.637a20.735 20.735 0 01-2.002 2.735 21.696 21.696 0 01-2.392 2.49 15.554 15.554 0 01-2.49 1.806c-.814.456-1.579.684-2.295.684-.684 0-1.14-.244-1.368-.732a3.925 3.925 0 01-.293-1.465zm14.795-30.224c0-.098.033-.244.098-.44.065-.195.147-.406.244-.634.13-.228.244-.44.342-.635a2.9 2.9 0 01.293-.39.806.806 0 00.244-.05h.147a.37.37 0 01.146-.048c.619 0 1.156.211 1.611.635.489.423.896.944 1.221 1.562.326.619.553 1.27.684 1.953.162.651.244 1.221.244 1.71 0 .325-.049.78-.147 1.366a6.21 6.21 0 01-.488 1.563 4.294 4.294 0 01-.83 1.318 1.581 1.581 0 01-1.221.537c-.553 0-.993-.358-1.318-1.074a19.656 19.656 0 01-.781-2.539 22.555 22.555 0 01-.391-2.832 33.841 33.841 0 01-.098-2.002zM41.648 235.666c0-1.628.227-3.288.683-4.98a27.747 27.747 0 011.953-4.932 29.46 29.46 0 012.979-4.541 21.833 21.833 0 013.857-3.711 17.756 17.756 0 014.541-2.49 14.035 14.035 0 015.03-.928c.748 0 1.708.081 2.88.244 1.205.163 2.36.44 3.467.83 1.14.391 2.1.912 2.88 1.563.815.618 1.222 1.367 1.222 2.246 0 .065-.017.13-.05.195v.147a.433.433 0 00-.048.195 7.138 7.138 0 01-.488.586c-.26.26-.44.423-.537.488a.537.537 0 01-.245.049.91.91 0 01-.293.049.673.673 0 01-.293-.049.428.428 0 01-.195-.049c-.162-.098-.553-.293-1.172-.586a111.48 111.48 0 00-4.004-2.002c-.618-.325-1.009-.521-1.171-.586-.13 0-.26-.016-.391-.049h-.293a.816.816 0 00-.244-.048c-1.53 0-2.995.276-4.395.83a14.053 14.053 0 00-3.857 2.295 19.5 19.5 0 00-3.174 3.369 24.312 24.312 0 00-2.441 4.053 22.9 22.9 0 00-1.514 4.345 19.77 19.77 0 00-.488 4.297c0 1.823.293 3.451.879 4.883.586 1.432 1.4 2.637 2.441 3.613 1.042.944 2.279 1.66 3.71 2.149 1.466.488 3.044.732 4.737.732.977 0 2.181-.13 3.614-.391 1.432-.26 2.799-.683 4.101-1.269 1.335-.586 2.458-1.335 3.37-2.246.91-.944 1.366-2.1 1.366-3.467 0-.553-.081-.977-.244-1.27-.162-.325-.39-.553-.683-.683-.293-.163-.651-.244-1.075-.244a16.974 16.974 0 00-1.318-.049c-.716 0-1.335.114-1.855.342-.521.228-1.042.488-1.563.781-.488.293-.993.553-1.514.781-.488.228-1.074.342-1.757.342-.847 0-1.514-.13-2.002-.391-.489-.26-.733-.862-.733-1.806 0-.912.326-1.644.977-2.198a6.867 6.867 0 012.392-1.318c.944-.293 1.921-.488 2.93-.586 1.01-.097 1.84-.146 2.49-.146 1.172 0 2.263.097 3.272.293 1.009.162 1.872.488 2.588.976.748.456 1.318 1.107 1.709 1.953.39.814.586 1.872.586 3.174 0 2.018-.554 3.776-1.66 5.274-1.107 1.464-2.507 2.669-4.2 3.613a21.399 21.399 0 01-5.42 2.148c-1.92.456-3.71.684-5.37.684-2.345 0-4.51-.407-6.495-1.221-1.953-.814-3.63-1.953-5.03-3.418-1.399-1.497-2.49-3.255-3.27-5.273-.782-2.051-1.172-4.248-1.172-6.592zm56.542 11.035a92.667 92.667 0 00-3.222 2.295 21.385 21.385 0 01-2.588 1.66c-.846.456-1.758.798-2.734 1.026-.945.228-2.116.341-3.516.341-3.027 0-5.274-.797-6.738-2.392-1.465-1.628-2.198-4.037-2.198-7.227 0-1.237.163-2.522.489-3.857a20.549 20.549 0 011.416-3.955 23.198 23.198 0 012.295-3.76 17.322 17.322 0 012.978-3.174 14.19 14.19 0 013.516-2.148 9.903 9.903 0 014.004-.83c2.343.228 4.183.813 5.517 1.758a8.692 8.692 0 013.028 3.564c.683 1.432 1.155 3.044 1.416 4.834.26 1.758.455 3.581.585 5.469.163 1.888.359 3.776.586 5.664.228 1.888.7 3.629 1.416 5.224-.423 1.075-.83 1.823-1.22 2.246-.358.456-.765.538-1.221.245-.456-.293-.993-1.01-1.611-2.149-.586-1.139-1.319-2.75-2.198-4.834zm-16.845-4.199c0 1.855.341 3.223 1.025 4.102.716.846 1.97 1.269 3.76 1.269 1.335 0 2.604-.228 3.809-.684 1.237-.488 2.31-1.139 3.222-1.953a9.779 9.779 0 002.197-3.027c.554-1.172.83-2.474.83-3.906 0-.586.017-1.4.05-2.442a17.131 17.131 0 00-.196-3.173c-.163-1.042-.472-1.937-.928-2.686-.456-.781-1.14-1.172-2.05-1.172-1.693 0-3.256.44-4.688 1.318a13.185 13.185 0 00-3.711 3.272 15.968 15.968 0 00-2.441 4.443c-.586 1.595-.88 3.142-.88 4.639zm26.172-10.01c0-.293.016-.586.048-.879.033-.325.098-.602.196-.83.097-.26.244-.472.439-.635.228-.162.537-.244.928-.244.325 0 .684.261 1.074.782.423.488.847 1.123 1.27 1.904.423.749.83 1.579 1.22 2.49.424.912.782 1.758 1.075 2.539.325.749.586 1.4.781 1.953.195.554.309.847.342.879.423-1.139.895-2.376 1.416-3.711a19.89 19.89 0 011.904-3.711c.781-1.172 1.693-2.148 2.734-2.929 1.075-.782 2.377-1.172 3.907-1.172.781 0 1.513.13 2.197.39a4.795 4.795 0 011.855 1.075 5.044 5.044 0 011.319 1.66c.325.651.488 1.399.488 2.246 0 .716-.293 1.221-.879 1.513-.553.293-1.188.44-1.904.44h-.489l-2.099-2.1c-.065 0-.114-.016-.147-.048h-.195c-.032-.033-.081-.049-.146-.049-1.14 0-2.035.325-2.686.976-.618.619-1.09 1.4-1.416 2.344a12.046 12.046 0 00-.635 2.93 43.527 43.527 0 00-.097 2.783c0 .651.065 1.318.195 2.002.13.651.277 1.302.439 1.953.163.618.31 1.269.44 1.953.13.651.195 1.335.195 2.051 0 1.367-.732 2.051-2.197 2.051-.814 0-1.66-.424-2.539-1.27-.879-.879-1.758-1.986-2.637-3.32a46.016 46.016 0 01-2.441-4.395 62.821 62.821 0 01-2.051-4.736 52.727 52.727 0 01-1.416-4.15c-.326-1.237-.488-2.149-.488-2.735zm23.877 14.746c0-1.888.472-3.564 1.416-5.029a15.046 15.046 0 013.515-3.809 22.432 22.432 0 014.541-2.783c1.628-.781 3.141-1.416 4.541-1.904 1.4-.521 2.572-.928 3.516-1.221.944-.325 1.416-.586 1.416-.781 0-1.139-.065-2.246-.195-3.32a116.724 116.724 0 00-.342-3.321c-.13-1.106-.261-2.197-.391-3.271a37.08 37.08 0 01-.146-3.272v-3.173c1.334-.489 2.278-.44 2.832.146.586.586.683 1.595.293 3.027.13.716.309 1.84.537 3.369.228 1.53.472 3.256.732 5.176.293 1.921.586 3.939.879 6.055.326 2.116.619 4.15.879 6.103.293 1.921.537 3.646.732 5.176l.44 3.369c.032.163.065.489.098.977.032.456.048.96.048 1.514.033.52.049 1.009.049 1.464.033.456.049.782.049.977-1.237 0-2.083-.049-2.539-.146-.423-.098-.7-.293-.83-.586-.098-.293-.147-.717-.147-1.27s-.162-1.318-.488-2.295c-1.204.944-2.344 1.725-3.418 2.344a20.56 20.56 0 01-3.223 1.514 16.347 16.347 0 01-3.271.732c-1.074.163-2.23.244-3.467.244a18.36 18.36 0 01-3.027-.244 7.912 7.912 0 01-2.539-.977 5.193 5.193 0 01-1.807-1.855c-.456-.781-.683-1.758-.683-2.93zm4.248-1.025c0 .521.114.944.341 1.269.228.326.521.603.879.83.358.228.733.391 1.123.489.424.065.83.097 1.221.097 1.139 0 2.36-.211 3.662-.634a14.353 14.353 0 003.662-1.856c1.14-.814 2.067-1.774 2.783-2.881.749-1.106 1.124-2.311 1.124-3.613 0-1.009-.18-1.709-.538-2.1-.358-.39-1.041-.585-2.05-.585-1.042 0-2.263.244-3.662.732a20.605 20.605 0 00-4.004 1.953 13.09 13.09 0 00-3.223 2.881c-.879 1.074-1.318 2.213-1.318 3.418zm24.072-6.787c0-1.758.211-3.516.635-5.274.423-1.757 1.09-3.336 2.002-4.736a11.333 11.333 0 013.613-3.418c1.497-.879 3.304-1.318 5.42-1.318 1.204 0 2.262.228 3.174.683a6.742 6.742 0 012.295 1.709c.618.716 1.074 1.563 1.367 2.539.325.944.488 1.937.488 2.979 0 1.66-.391 3.271-1.172 4.834a13.652 13.652 0 01-3.076 4.15 13.213 13.213 0 01-4.395 2.686 9.627 9.627 0 01-5.078.39c.033.944.342 1.709.928 2.295a6.383 6.383 0 002.197 1.27c.847.293 1.726.488 2.637.586.911.065 1.725.097 2.441.097.749 0 1.449-.065 2.1-.195s1.302-.277 1.953-.439c.651-.163 1.302-.31 1.953-.44.684-.13 1.4-.195 2.149-.195.293 0 .586.016.879.049.293.032.569.114.83.244.26.098.472.277.634.537.163.228.245.521.245.879 0 .618-.228 1.139-.684 1.562-.456.391-1.042.733-1.758 1.026-.683.293-1.448.521-2.295.683-.846.131-1.676.245-2.49.342-.781.065-1.514.098-2.197.098-.651.032-1.14.049-1.465.049-2.083 0-3.955-.326-5.615-.977-1.66-.683-3.06-1.611-4.2-2.783-1.139-1.205-2.018-2.637-2.636-4.297-.586-1.693-.879-3.564-.879-5.615zm5.176-3.174c0 1.139.146 1.969.439 2.49.326.521 1.091.781 2.295.781a7.3 7.3 0 002.49-.439 7.928 7.928 0 002.198-1.318 6.184 6.184 0 001.611-1.954c.39-.748.586-1.562.586-2.441 0-.488-.049-.993-.147-1.514a3.507 3.507 0 00-.488-1.416 2.964 2.964 0 00-1.025-1.074c-.391-.293-.912-.439-1.563-.439-.976 0-1.872.228-2.685.683a6.299 6.299 0 00-2.002 1.709 7.408 7.408 0 00-1.27 2.344 7.857 7.857 0 00-.439 2.588zm22.07.293c0-.846.212-1.449.635-1.807.423-.39 1.106-.586 2.051-.586h.488c.097.521.211 1.123.342 1.807.13.684.325 1.383.586 2.1.26.716.569 1.383.927 2.002a4.616 4.616 0 001.319 1.416c.032-1.14.309-2.23.83-3.272a11.954 11.954 0 012.002-2.832 12.267 12.267 0 012.636-2.1c.977-.585 1.937-.976 2.881-1.171h1.074c1.563 0 2.898.358 4.004 1.074a8.435 8.435 0 012.735 2.734c.748 1.107 1.318 2.376 1.709 3.809.39 1.432.683 2.897.879 4.394.227 1.465.358 2.897.39 4.297.065 1.367.098 2.539.098 3.516h-3.565a90.373 90.373 0 00-.732-5.615 32.771 32.771 0 00-.391-2.247 28.158 28.158 0 00-.537-2.246 19.892 19.892 0 00-.634-1.953c-.228-.618-.489-1.139-.782-1.562l-.537-.537a12.007 12.007 0 00-1.269-1.27c-.196-.163-.31-.244-.342-.244-.977-.26-1.823-.065-2.539.586-.716.618-1.351 1.465-1.905 2.539-.553 1.074-1.009 2.295-1.367 3.662a72.752 72.752 0 00-.83 3.955 42.545 42.545 0 00-.488 3.272 46.713 46.713 0 01-.195 1.66c-.814.586-1.579.765-2.295.537-.716-.261-1.4-.781-2.051-1.563-.619-.781-1.188-1.757-1.709-2.929a49.218 49.218 0 01-1.367-3.711 93.436 93.436 0 01-1.172-4.004 254.107 254.107 0 01-.879-3.711z"
      ></path>
    </svg>
  );
}

export default Icon;
