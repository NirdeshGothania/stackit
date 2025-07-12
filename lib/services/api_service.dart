import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/answer.dart';
import '../models/question.dart';

class ApiService {
  static const String baseUrl =
      'http://localhost:3000/api'; // Change to your Node.js backend URL

  // Helper method to get headers with optional auth token
  static Map<String, String> _getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Questions API
  static Future<List<Question>> getQuestions({
    int page = 1,
    int limit = 10,
    String? filter,
    String? search,
    String? tag,
    String? token,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (filter != null) 'filter': filter,
        if (search != null) 'q': search,
        if (tag != null) 'tag': tag,
      };

      final uri =
          Uri.parse('$baseUrl/questions').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _getHeaders(token: token));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> questionsData = data['questions'];
        return questionsData.map((json) => Question.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load questions: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Map<String, dynamic>> getQuestion(String id,
      {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/questions/$id'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'question': Question.fromJson(data['question']),
          'answers': (data['answers'] as List)
              .map((json) => Answer.fromJson(json))
              .toList(),
        };
      } else {
        throw Exception('Failed to load question: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Question> createQuestion({
    required String title,
    required String content,
    required List<String> tags,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/questions'),
        headers: _getHeaders(token: token),
        body: json.encode({
          'title': title,
          'content': content,
          'tags': tags,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return Question.fromJson(data['question']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to create question');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> voteQuestion(
      String questionId, String token, int vote) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/questions/$questionId/vote'),
        headers: _getHeaders(token: token),
        body: json.encode({'vote': vote}),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to vote on question');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Answers API
  static Future<List<Answer>> getAnswers(String questionId,
      {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/answers/question/$questionId'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> answersData = data['answers'];
        return answersData.map((json) => Answer.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load answers: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Answer> createAnswer({
    required String questionId,
    required String content,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/answers'),
        headers: _getHeaders(token: token),
        body: json.encode({
          'questionId': questionId,
          'content': content,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return Answer.fromJson(data['answer']);
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to create answer');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> voteAnswer(
      String answerId, String token, int vote) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/answers/$answerId/vote'),
        headers: _getHeaders(token: token),
        body: json.encode({'vote': vote}),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to vote on answer');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> acceptAnswer(String answerId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/answers/$answerId/accept'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to accept answer');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Tags API
  static Future<List<String>> getTags() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/tags'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> tagsData = data['tags'];
        return tagsData.map((tag) => tag['name'] as String).toList();
      } else {
        throw Exception('Failed to load tags: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<List<Map<String, dynamic>>> getPopularTags(
      {int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tags/popular?limit=$limit'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> tagsData = data['tags'];
        return tagsData
            .map((tag) => {
                  'name': tag['name'],
                  'count': tag['count'],
                })
            .toList();
      } else {
        throw Exception('Failed to load popular tags: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Notifications API
  static Future<Map<String, dynamic>> getNotifications({
    required String token,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications?page=$page&limit=$limit'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load notifications: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<int> getUnreadNotificationCount(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/unread-count'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['unreadCount'] ?? 0;
      } else {
        throw Exception('Failed to get unread count: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> markNotificationAsRead(
      String notificationId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/$notificationId/read'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode != 200) {
        throw Exception(
            'Failed to mark notification as read: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // User Profile API
  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: _getHeaders(token: token),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load user profile: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> updateUserProfile({
    required String token,
    String? displayName,
    String? avatarUrl,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (displayName != null) body['displayName'] = displayName;
      if (avatarUrl != null) body['avatarUrl'] = avatarUrl;

      final response = await http.put(
        Uri.parse('$baseUrl/auth/profile'),
        headers: _getHeaders(token: token),
        body: json.encode(body),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to update profile');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // FCM Token API
  static Future<void> updateFCMToken({
    required String token,
    required String fcmToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/fcm-token'),
        headers: _getHeaders(token: token),
        body: json.encode({fcmToken}),
      );

      if (response.statusCode != 200) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to update FCM token');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
