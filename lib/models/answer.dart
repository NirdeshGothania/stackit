class Answer {
  final String id;
  final String questionId;
  final String content;
  final String authorId;
  final String authorName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int voteCount;
  final bool isAccepted;
  final List<String> voters;

  Answer({
    required this.id,
    required this.questionId,
    required this.content,
    required this.authorId,
    required this.authorName,
    required this.createdAt,
    required this.updatedAt,
    this.voteCount = 0,
    this.isAccepted = false,
    this.voters = const [],
  });

  factory Answer.fromJson(Map<String, dynamic> json) {
    return Answer(
      id: json['id'] ?? '',
      questionId: json['questionId'] ?? '',
      content: json['content'] ?? '',
      authorId: json['authorId'] ?? '',
      authorName: json['authorName'] ?? '',
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      voteCount: json['voteCount'] ?? 0,
      isAccepted: json['isAccepted'] ?? false,
      voters: List<String>.from(json['voters'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'questionId': questionId,
      'content': content,
      'authorId': authorId,
      'authorName': authorName,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'voteCount': voteCount,
      'isAccepted': isAccepted,
      'voters': voters,
    };
  }

  Answer copyWith({
    String? id,
    String? questionId,
    String? content,
    String? authorId,
    String? authorName,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? voteCount,
    bool? isAccepted,
    List<String>? voters,
  }) {
    return Answer(
      id: id ?? this.id,
      questionId: questionId ?? this.questionId,
      content: content ?? this.content,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      voteCount: voteCount ?? this.voteCount,
      isAccepted: isAccepted ?? this.isAccepted,
      voters: voters ?? this.voters,
    );
  }
}
